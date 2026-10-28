import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Mail, RefreshCw, Search, Inbox } from "lucide-react";
import {
  getSupportMessages,
  updateSupportMessageStatus,
  type SupportMessage,
} from "../../services/adminApi";

type Filter = "all" | SupportMessage["status"];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function statusLabel(status: SupportMessage["status"]) {
  if (status === "in_review") return "In review";
  if (status === "resolved") return "Resolved";
  return "New";
}

export default function SupportInbox() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMessages(await getSupportMessages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load support messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMessages(); }, [loadMessages]);

  const counts = useMemo(() => ({
    all: messages.length,
    new: messages.filter((message) => message.status === "new").length,
    in_review: messages.filter((message) => message.status === "in_review").length,
    resolved: messages.filter((message) => message.status === "resolved").length,
  }), [messages]);

  const visibleMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return messages.filter((message) => {
      const matchesStatus = filter === "all" || message.status === filter;
      const matchesSearch = !query || [message.name, message.email, message.subject, message.message]
        .some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [messages, filter, search]);

  async function changeStatus(message: SupportMessage, status: SupportMessage["status"]) {
    setUpdatingId(message.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateSupportMessageStatus(message.id, status);
      setMessages((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`Message marked ${statusLabel(status).toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the message.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All messages", count: counts.all },
    { value: "new", label: "New", count: counts.new },
    { value: "in_review", label: "In review", count: counts.in_review },
    { value: "resolved", label: "Resolved", count: counts.resolved },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Customer care</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Support inbox</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Read contact-form messages and track which ones still need a reply.</p>
        </div>
        <button type="button" onClick={() => void loadMessages()} disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">New messages</p><p className="mt-2 text-3xl font-black text-slate-950">{counts.new}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">In review</p><p className="mt-2 text-3xl font-black text-slate-950">{counts.in_review}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Resolved</p><p className="mt-2 text-3xl font-black text-slate-950">{counts.resolved}</p></div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {filters.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${filter === item.value ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
            {item.label} <span className="ml-1 opacity-70">{item.count}</span>
          </button>)}
        </div>
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 sm:w-72">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages..." className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>

      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading support messages…</div>
        : visibleMessages.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Inbox size={30} className="mx-auto text-slate-300" />
            <h2 className="mt-3 font-bold text-slate-800">No messages here yet</h2>
            <p className="mt-1 text-sm text-slate-500">Contact-form submissions will appear here after they are saved by the server.</p>
          </div>
        : <div className="space-y-4">{visibleMessages.map((message) => <article key={message.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-lg font-extrabold text-slate-950">{message.subject}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${message.status === "new" ? "bg-blue-50 text-blue-700" : message.status === "in_review" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{statusLabel(message.status)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{message.name}</span>
                  <a href={`mailto:${message.email}`} className="inline-flex items-center gap-1 text-indigo-600 hover:underline"><Mail size={13} />{message.email}</a>
                  <span className="inline-flex items-center gap-1"><Clock3 size={13} />{formatDate(message.created_at)}</span>
                </div>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{message.message}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 lg:w-44 lg:flex-col">
                {message.status === "new" && <button type="button" disabled={updatingId === message.id} onClick={() => void changeStatus(message, "in_review")} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Mark in review</button>}
                {message.status !== "resolved" && <button type="button" disabled={updatingId === message.id} onClick={() => void changeStatus(message, "resolved")} className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"><CheckCircle2 size={14} /> Mark resolved</button>}
                {message.status !== "new" && <button type="button" disabled={updatingId === message.id} onClick={() => void changeStatus(message, "new")} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50">Reopen</button>}
              </div>
            </div>
          </article>)}</div>}
    </div>
  );
}
