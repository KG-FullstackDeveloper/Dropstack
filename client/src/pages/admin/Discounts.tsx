import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgePercent, Plus, Search, Tag, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "").replace(/\/api$/i, "");
type DiscountType = "product_amount" | "order_amount" | "buy_x_get_y" | "free_shipping";
type Store = { id: string; name: string; slug: string; status: string };
type Discount = { id: string; storeId: string; name: string; code: string; type: DiscountType; value: number; productIds: string[]; minimumOrderAmount: number | null; minimumQuantity: number | null; buyQuantity: number | null; getQuantity: number | null; getDiscountPercent: number; startsAt: string | null; endsAt: string | null; usageLimit: number | null; usageCount: number; perCustomerLimit: number | null; active: boolean };
type Draft = Omit<Discount, "id" | "storeId" | "usageCount">;
const blank: Draft = { name: "", code: "", type: "order_amount", value: 10, productIds: [], minimumOrderAmount: null, minimumQuantity: null, buyQuantity: 1, getQuantity: 1, getDiscountPercent: 100, startsAt: null, endsAt: null, usageLimit: null, perCustomerLimit: null, active: true };
const typeLabels: Record<DiscountType, string> = { product_amount: "Amount off products", order_amount: "Amount off order", buy_x_get_y: "Buy X, get Y", free_shipping: "Free shipping" };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = localStorage.getItem("admin_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_ORIGIN}/api${path}`, { ...init, headers, credentials: "include" });
  const body = await response.json();
  if (!response.ok || body.success === false) throw new Error(body.error || "Request failed.");
  return body.data as T;
}

export default function Discounts() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState("");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadStores = useCallback(async () => {
    try {
      const rows = await api<Store[]>("/stores");
      setStores(rows);
      setStoreId(current => current || rows[0]?.id || "");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load stores."); }
    finally { setLoading(false); }
  }, []);
  const loadDiscounts = useCallback(async () => {
    if (!storeId) { setDiscounts([]); return; }
    try { setDiscounts(await api<Discount[]>(`/discounts?store_id=${encodeURIComponent(storeId)}`)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load discounts."); }
  }, [storeId]);
  useEffect(() => { void loadStores(); }, [loadStores]);
  useEffect(() => { void loadDiscounts(); }, [loadDiscounts]);

  const visible = useMemo(() => discounts.filter(d => `${d.name} ${d.code}`.toLowerCase().includes(search.toLowerCase())), [discounts, search]);
  function startCreate() { setEditing(null); setDraft({ ...blank }); setError(""); setNotice(""); setShowForm(true); }
  function startEdit(item: Discount) {
    setEditing(item.id);
    setDraft({ name: item.name, code: item.code, type: item.type, value: item.value, productIds: item.productIds || [], minimumOrderAmount: item.minimumOrderAmount, minimumQuantity: item.minimumQuantity, buyQuantity: item.buyQuantity, getQuantity: item.getQuantity, getDiscountPercent: item.getDiscountPercent, startsAt: item.startsAt, endsAt: item.endsAt, usageLimit: item.usageLimit, perCustomerLimit: item.perCustomerLimit, active: item.active });
    setError(""); setShowForm(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!storeId) { setError("Create or select a store first."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const payload = { ...draft, storeId, code: draft.code.toUpperCase().replace(/\s+/g, "") };
      if (editing) await api(`/discounts/${encodeURIComponent(editing)}`, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/discounts", { method: "POST", body: JSON.stringify(payload) });
      await loadDiscounts(); setShowForm(false); setNotice(editing ? "Discount updated." : "Discount created.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save discount."); }
    finally { setBusy(false); }
  }
  async function toggle(item: Discount) {
    try { await api(`/discounts/${encodeURIComponent(item.id)}`, { method: "PUT", body: JSON.stringify({ ...item, storeId, active: !item.active }) }); await loadDiscounts(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update discount."); }
  }
  async function remove(item: Discount) {
    if (!window.confirm(`Delete discount ${item.code}?`)) return;
    try { await api(`/discounts/${encodeURIComponent(item.id)}?store_id=${encodeURIComponent(storeId)}`, { method: "DELETE" }); await loadDiscounts(); setNotice("Discount deleted."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not delete discount."); }
  }
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(current => ({ ...current, [key]: value }));

  return <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"><BadgePercent size={14}/> SALES & PROMOTIONS</div><h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Discounts</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Create store-specific discount codes and control when customers can use them.</p></div><button onClick={startCreate} disabled={!storeId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40"><Plus size={17}/> Create discount</button></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
    <section className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Total codes</p><p className="mt-2 text-2xl font-black">{discounts.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Active codes</p><p className="mt-2 text-2xl font-black">{discounts.filter(d => d.active).length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Usage recorded</p><p className="mt-2 text-2xl font-black">{discounts.reduce((n,d) => n+d.usageCount,0)}</p></div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"><Search size={16} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search discount codes" className="w-full min-w-0 text-sm outline-none sm:w-56"/></label><select aria-label="Select store" value={storeId} onChange={e=>setStoreId(e.target.value)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"><option value="">Select a store</option>{stores.map(s=><option key={s.id} value={s.id}>{s.name} ({s.slug})</option>)}</select></div>
      {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading discounts…</p> : !visible.length ? <div className="p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100"><Tag size={21}/></div><h2 className="mt-4 font-bold">No discounts yet</h2><p className="mt-1 text-sm text-slate-500">Create your first code for this store.</p><button onClick={startCreate} className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Create discount</button></div> : <div className="divide-y divide-slate-100">{visible.map(item=><div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Tag size={18}/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-900">{item.name}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.active ? "Active" : "Inactive"}</span></div><p className="mt-1 text-sm text-slate-500"><code className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-800">{item.code}</code><span className="mx-2">·</span>{typeLabels[item.type]}<span className="mx-2">·</span>{item.usageCount}{item.usageLimit ? ` / ${item.usageLimit}` : " uses"}</p></div></div><div className="flex flex-wrap gap-2"><button onClick={()=>void toggle(item)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">{item.active?<ToggleRight size={16}/>:<ToggleLeft size={16}/>} {item.active?"Deactivate":"Activate"}</button><button onClick={()=>startEdit(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">Edit</button><button onClick={()=>void remove(item)} aria-label={`Delete ${item.code}`} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600"><Trash2 size={15}/></button></div></div>)}</div>}
    </section>
    <p className="text-xs leading-5 text-slate-500">Codes are unique within each store. The server checks active status, dates, minimums and usage limits. Discount usage is not counted as redeemed until checkout is connected to the order-creation flow.</p>
    {showForm && <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-950/40 p-3 sm:p-6"><div className="mx-auto my-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="text-lg font-black">{editing?"Edit discount":"Create discount"}</h2><p className="mt-1 text-xs text-slate-500">Applies only to the selected store.</p></div><button onClick={()=>setShowForm(false)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close"><X size={18}/></button></div><form onSubmit={save} className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-xs font-bold text-slate-600">Discount name<input required value={draft.name} onChange={e=>set("name",e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900" placeholder="Summer offer"/></label><label className="space-y-1 text-xs font-bold text-slate-600">Discount code<input required minLength={3} maxLength={40} value={draft.code} onChange={e=>set("code",e.target.value.toUpperCase().replace(/\s+/g,""))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold uppercase text-slate-900" placeholder="SUMMER10"/></label></div>
      <label className="block space-y-1 text-xs font-bold text-slate-600">Discount type<select value={draft.type} onChange={e=>set("type",e.target.value as DiscountType)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900">{Object.entries(typeLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      {draft.type!=="free_shipping"&&draft.type!=="buy_x_get_y"&&<label className="block space-y-1 text-xs font-bold text-slate-600">Discount amount (store currency)<input required type="number" min="0.01" step="0.01" value={draft.value} onChange={e=>set("value",Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"/><span className="font-normal text-slate-400">Fixed amount discount. Percentage support can be added as a separate explicit setting.</span></label>}
      {draft.type==="product_amount"&&<label className="block space-y-1 text-xs font-bold text-slate-600">Eligible product IDs (optional, comma separated)<input value={draft.productIds.join(", ")} onChange={e=>set("productIds",e.target.value.split(",").map(v=>v.trim()).filter(Boolean))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900" placeholder="Leave blank for all products"/></label>}
      {draft.type==="buy_x_get_y"&&<div className="grid gap-4 sm:grid-cols-3">{([["buyQuantity","Buy quantity"],["getQuantity","Get quantity"],["getDiscountPercent","Reward discount %"]] as const).map(([k,label])=><label key={k} className="space-y-1 text-xs font-bold text-slate-600">{label}<input type="number" min="1" max={k==="getDiscountPercent"?100:999} value={draft[k]??1} onChange={e=>set(k,Number(e.target.value) as never)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"/></label>)}</div>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-xs font-bold text-slate-600">Minimum order amount<input type="number" min="0" step="0.01" value={draft.minimumOrderAmount??""} onChange={e=>set("minimumOrderAmount",e.target.value===""?null:Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900" placeholder="No minimum"/></label><label className="space-y-1 text-xs font-bold text-slate-600">Minimum item quantity<input type="number" min="1" value={draft.minimumQuantity??""} onChange={e=>set("minimumQuantity",e.target.value===""?null:Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900" placeholder="No minimum"/></label><label className="space-y-1 text-xs font-bold text-slate-600">Total usage limit<input type="number" min="1" value={draft.usageLimit??""} onChange={e=>set("usageLimit",e.target.value===""?null:Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900" placeholder="Unlimited"/></label><label className="space-y-1 text-xs font-bold text-slate-600">Uses per customer<input type="number" min="1" value={draft.perCustomerLimit??""} onChange={e=>set("perCustomerLimit",e.target.value===""?null:Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900" placeholder="Unlimited"/></label><label className="space-y-1 text-xs font-bold text-slate-600">Starts at<input type="datetime-local" value={draft.startsAt?draft.startsAt.slice(0,16):""} onChange={e=>set("startsAt",e.target.value?new Date(e.target.value).toISOString():null)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"/></label><label className="space-y-1 text-xs font-bold text-slate-600">Ends at<input type="datetime-local" value={draft.endsAt?draft.endsAt.slice(0,16):""} onChange={e=>set("endsAt",e.target.value?new Date(e.target.value).toISOString():null)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"/></label></div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.active} onChange={e=>set("active",e.target.checked)} className="h-4 w-4"/> Discount is active</label>
      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={()=>setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Cancel</button><button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy?"Saving…":editing?"Save changes":"Create discount"}</button></div>
    </form></div></div>}
  </div>;
}
