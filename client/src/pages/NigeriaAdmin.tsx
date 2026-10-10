import {
BarChart3,
Boxes,
CheckCircle2,
CircleDollarSign,
CreditCard,
ExternalLink,
Package,
PackageCheck,
Palette,
Plus,
Search,
Settings2,
ShoppingCart,
Store,
Users,
WalletCards,
X,
} from "lucide-react";
import {
useEffect,
useMemo,
useState,
type FormEvent,
type ComponentType,
type ReactNode,
} from "react";

import WorkspaceSettings from "./admin/WorkSpaceSettings";

import AdminShell from "../components/admin/AdminShell";
import type { SettingsSection } from "../components/settings/DashboardSettingsTypes";

type PageKey =
| "Overview"
| "Stores"
| "Orders"
| "Fulfillment"
| "Products"
| "Customers"
| "Analytics"
| "Payments"
| "Shipping"
| "Inventory"
| "Storefront"
| "Theme Editor"
| "Settings";

type OrderStatus =
| "payment_pending"
| "payment_confirmed"
| "ready_to_fulfill"
| "supplier_ordered"
| "shipped"
| "delivered"
| "cancelled";

type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded";

interface NigeriaOrder {
id: string;
customerName: string;
phone: string;
city: string;
state: string;
amount: number;
profit: number;
status: OrderStatus;
paymentStatus: PaymentStatus;
supplierName: string;
trackingNumber: string;
createdAt: string;
}

interface NigeriaProduct {
id: string;
name: string;
category: string;
price: number;
supplierCost: number;
shippingCost: number;
otherCost: number;
inventory: number;
active: boolean;
}

interface NigeriaData {
orders: NigeriaOrder[];
products: NigeriaProduct[];
settings: {
storeName: string;
supplierName: string;
paymentMethod: "flutterwave" | "manual" | "cod";
shippingFee: number;
deliveryEstimate: string;
};
}

const STORAGE_KEY = "meo_nigeria_ecommerce_dashboard_v2";
const THEME_KEY = "meo_nigeria_dashboard_theme_v1";

const EMPTY_DATA: NigeriaData = {
orders: [],
products: [],
settings: {
storeName: "Nigeria Ecommerce",
supplierName: "",
paymentMethod: "flutterwave",
shippingFee: 0,
deliveryEstimate: "2–7 business days",
},
};

type IconType = ComponentType<{
size?: number;
className?: string;
}>;

function loadData(): NigeriaData {
try {
const raw = localStorage.getItem(STORAGE_KEY);

if (!raw) {
  return EMPTY_DATA;
}

const parsed = JSON.parse(raw) as Partial<NigeriaData>;

return {
  orders: Array.isArray(parsed.orders) ? parsed.orders : [],
  products: Array.isArray(parsed.products) ? parsed.products : [],
  settings: {
    ...EMPTY_DATA.settings,
    ...(parsed.settings || {}),
  },
};

} catch {
return EMPTY_DATA;
}
}

function saveData(data: NigeriaData) {
localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function money(value: number) {
return new Intl.NumberFormat("en-NG", {
style: "currency",
currency: "NGN",
maximumFractionDigits: 0,
}).format(Number(value) || 0);
}

function shortDate(value: string) {
const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return "—";
}

return date.toLocaleDateString("en-NG", {
day: "2-digit",
month: "short",
year: "numeric",
});
}

function statusLabel(value: string) {
return value
.replaceAll("_", " ")
.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value: string) {
switch (value) {
case "delivered":
case "confirmed":
return "bg-emerald-50 text-emerald-700";

case "shipped":
case "supplier_ordered":
  return "bg-blue-50 text-blue-700";

case "payment_confirmed":
case "ready_to_fulfill":
  return "bg-amber-50 text-amber-700";

case "cancelled":
case "failed":
  return "bg-red-50 text-red-700";

default:
  return "bg-slate-100 text-slate-700";

}
}

function days14() {
return Array.from({ length: 14 }, (_, index) => {
const date = new Date();

date.setHours(0, 0, 0, 0);
date.setDate(date.getDate() - (13 - index));

return date;

});
}

function salesByDay(orders: NigeriaOrder[]) {
const days = days14();

return days.map((date) => {
const total = orders.reduce((sum, order) => {
const orderDate = new Date(order.createdAt);

  const sameDay =
    orderDate.getFullYear() === date.getFullYear() &&
    orderDate.getMonth() === date.getMonth() &&
    orderDate.getDate() === date.getDate();

  if (sameDay && order.paymentStatus === "confirmed") {
    return sum + order.amount;
  }

  return sum;
}, 0);

return {
  label: date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
  }),
  value: total,
};

});
}

function LineChart({
data,
title,
}: {
data: {
label: string;
value: number;
}[];
title: string;
}) {
const max = Math.max(...data.map((item) => item.value), 1);

const points = data
.map((item, index) => {
const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;

  const y = 92 - (item.value / max) * 76;

  return `${x},${y}`;
})
.join(" ");

return (
<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
<div className="flex items-center justify-between gap-4">
<div>
<p className="text-sm font-medium text-slate-500">{title}</p>

      <h2 className="mt-1 text-lg font-black text-slate-950">
        Sales performance
      </h2>
    </div>

    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
      14 days
    </span>
  </div>

  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    className="mt-7 h-64 w-full"
  >
    {[16, 38, 60, 82].map((y) => (
      <line
        key={y}
        x1="0"
        y1={y}
        x2="100"
        y2={y}
        stroke="currentColor"
        strokeWidth="0.5"
        className="text-slate-100"
      />
    ))}

    <polyline
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-slate-950"
      points={points}
    />
  </svg>

  <div className="mt-3 grid grid-cols-7 gap-2 text-[10px] text-slate-400">
    {data
      .filter((_, index) => index % 2 === 0)
      .map((item) => (
        <span key={item.label}>{item.label}</span>
      ))}
  </div>
</section>

);
}

function BarChart({ orders }: { orders: NigeriaOrder[] }) {
const states = ["Lagos", "Ogun", "Abuja", "Rivers", "Oyo"].map((state) => ({
state,
value: orders.filter(
(order) => order.state.toLowerCase() === state.toLowerCase(),
).length,
}));

const max = Math.max(...states.map((item) => item.value), 1);

return (
<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
<div>
<p className="text-sm font-medium text-slate-500">Orders by location</p>

    <h2 className="mt-1 text-lg font-black text-slate-950">
      Sales distribution
    </h2>
  </div>

  <div className="mt-7 space-y-5">
    {states.map((item) => (
      <div key={item.state}>
        <div className="mb-2 flex justify-between text-xs">
          <span className="font-semibold text-slate-700">{item.state}</span>

          <span className="text-slate-400">{item.value}</span>
        </div>

        <div className="h-2.5 rounded-full bg-slate-100">
          <div
            className="h-2.5 rounded-full bg-slate-950 transition-all"
            style={{
              width: item.value ? `${(item.value / max) * 100}%` : "0%",
            }}
          />
        </div>
      </div>
    ))}
  </div>
</section>

);
}

function MetricCard({
title,
value,
subtitle,
icon: Icon,
}: {
title: string;
value: string;
subtitle: string;
icon: IconType;
}) {
return (
<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
<div className="flex items-start justify-between gap-4">
<div>
<p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>

    <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
      <Icon size={19} />
    </div>
  </div>
</div>

);
}

function PageHeader({
eyebrow,
title,
description,
action,
}: {
eyebrow: string;
title: string;
description: string;
action?: ReactNode;
}) {
return (
<header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
<div>
<p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
{eyebrow}
</p>

    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
      {title}
    </h1>

    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
      {description}
    </p>
  </div>

  {action}
</header>

);
}

function Overview({ data }: { data: NigeriaData }) {
const confirmed = data.orders.filter(
(order) => order.paymentStatus === "confirmed",
);

const sales = confirmed.reduce((sum, order) => sum + order.amount, 0);

const profit = confirmed.reduce((sum, order) => sum + order.profit, 0);

const margin = sales > 0 ? (profit / sales) * 100 : 0;

return (
<div className="space-y-6">
<PageHeader eyebrow="Ecommerce Dashboard" title="Overview" description="Monitor the performance of this ecommerce workspace. Data is completely independent from Global Ecommerce." />

  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <MetricCard
      title="30-day sales"
      value={money(sales)}
      subtitle="Confirmed payments"
      icon={CircleDollarSign}
    />

    <MetricCard
      title="Orders"
      value={String(data.orders.length)}
      subtitle="Orders in this workspace"
      icon={ShoppingCart}
    />

    <MetricCard
      title="Profit"
      value={money(profit)}
      subtitle="Order profit"
      icon={WalletCards}
    />

    <MetricCard
      title="Margin"
      value={`${margin.toFixed(1)}%`}
      subtitle="Sales margin"
      icon={BarChart3}
    />
  </div>

  <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
    <LineChart data={salesByDay(data.orders)} title="Sales trend" />

    <BarChart orders={data.orders} />
  </div>

  <div className="grid gap-6 xl:grid-cols-2">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <PackageCheck size={20} className="text-slate-500" />

        <div>
          <p className="text-sm font-medium text-slate-500">
            Fulfillment pipeline
          </p>

          <h2 className="mt-1 text-lg font-black text-slate-950">
            Order pipeline
          </h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Pending", "payment_pending"],
          ["Ready", "ready_to_fulfill"],
          ["Shipped", "shipped"],
          ["Delivered", "delivered"],
        ].map(([label, status]) => (
          <div key={status} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">{label}</p>

            <p className="mt-2 text-xl font-black text-slate-950">
              {
                data.orders.filter((order) => order.status === status)
                  .length
              }
            </p>
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Business health</p>

      <h2 className="mt-1 text-lg font-black text-slate-950">
        Workspace operation
      </h2>

      <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
          Store
        </p>

        <p className="mt-2 text-xl font-black">{data.settings.storeName}</p>

        <p className="mt-1 text-sm text-white/60">
          Independent ecommerce workspace
        </p>
      </div>
    </section>
  </div>
</div>

);
}

function Orders({
data,
setOrders,
}: {
data: NigeriaData;
setOrders: (orders: NigeriaOrder[]) => void;
}) {
const [query, setQuery] = useState("");

const orders = data.orders.filter((order) =>
  `${order.id} ${order.customerName} ${order.phone} ${order.city} ${order.state}`
    .toLowerCase()
    .includes(query.toLowerCase()),
);

function changeStatus(id: string, status: OrderStatus) {
setOrders(
data.orders.map((order) =>
order.id === id
? {
...order,
status,
}
: order,
),
);
}

return (
<div className="space-y-6">
<PageHeader
eyebrow="Ecommerce Dashboard"
title="Orders"
description="Manage orders belonging only to this ecommerce workspace."
action={
<div className="relative">
<Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search orders"
          className="w-full min-w-[280px] rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400"
        />
      </div>
    }
  />

  <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    {orders.length === 0 ? (
      <div className="p-12 text-center">
        <ShoppingCart size={34} className="mx-auto text-slate-300" />

        <p className="mt-4 font-bold text-slate-900">No orders</p>

        <p className="mt-1 text-sm text-slate-500">
          Orders from the Global Ecommerce workspace are never loaded here.
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-[950px] w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4">Order</th>

              <th className="px-5 py-4">Customer</th>

              <th className="px-5 py-4">Location</th>

              <th className="px-5 py-4">Total</th>

              <th className="px-5 py-4">Payment</th>

              <th className="px-5 py-4">Fulfillment</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-5 py-4">
                  <p className="font-bold text-slate-950">#{order.id}</p>

                  <p className="mt-1 text-xs text-slate-400">
                    {shortDate(order.createdAt)}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">
                    {order.customerName}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {order.phone}
                  </p>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {order.city}, {order.state}
                </td>

                <td className="px-5 py-4 font-bold text-slate-950">
                  {money(order.amount)}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(
                      order.paymentStatus,
                    )}`}
                  >
                    {statusLabel(order.paymentStatus)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <select
                    value={order.status}
                    onChange={(event) =>
                      changeStatus(
                        order.id,
                        event.target.value as OrderStatus,
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                  >
                    {[
                      "payment_pending",
                      "payment_confirmed",
                      "ready_to_fulfill",
                      "supplier_ordered",
                      "shipped",
                      "delivered",
                      "cancelled",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
</div>

);
}

function Products({
data,
addProduct,
}: {
data: NigeriaData;
addProduct: (product: NigeriaProduct) => void;
}) {
const [open, setOpen] = useState(false);
const [name, setName] = useState("");
const [category, setCategory] = useState("");
const [price, setPrice] = useState("");
const [inventory, setInventory] = useState("");

function submit(event: FormEvent) {
event.preventDefault();

const numericPrice = Number(price);
const numericInventory = Number(inventory);

if (
  !name.trim() ||
  !category.trim() ||
  !Number.isFinite(numericPrice) ||
  numericPrice <= 0
) {
  return;
}

addProduct({
  id: `ng-product-${Date.now()}`,
  name: name.trim(),
  category: category.trim(),
  price: numericPrice,
  supplierCost: 0,
  shippingCost: 0,
  otherCost: 0,
  inventory: Number.isFinite(numericInventory)
    ? Math.max(0, numericInventory)
    : 0,
  active: true,
});

setName("");
setCategory("");
setPrice("");
setInventory("");
setOpen(false);

}

return (
<div className="space-y-6">
<PageHeader
eyebrow="Ecommerce Dashboard"
title="Products"
description="Manage the product catalog for this ecommerce workspace."
action={
<button
type="button"
onClick={() => setOpen(true)}
className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
>
<Plus size={16} />
Add product
</button>
}
/>

  {data.products.length === 0 ? (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <Package size={34} className="mx-auto text-slate-300" />

      <p className="mt-4 font-bold text-slate-900">No products yet</p>

      <p className="mt-1 text-sm text-slate-500">
        Add products to this workspace independently.
      </p>
    </section>
  ) : (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.products.map((product) => (
        <article
          key={product.id}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Package size={20} />
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                product.active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {product.active ? "Active" : "Draft"}
            </span>
          </div>

          <h2 className="mt-5 font-black text-slate-950">{product.name}</h2>

          <p className="mt-1 text-sm text-slate-500">{product.category}</p>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-lg font-black text-slate-950">
              {money(product.price)}
            </span>

            <span className="text-xs font-semibold text-slate-500">
              {product.inventory} in stock
            </span>
          </div>
        </article>
      ))}
    </div>
  )}

  {open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Add product</h2>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Product name"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Selling price in NGN"
            type="number"
            min="0"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <input
            value={inventory}
            onChange={(event) => setInventory(event.target.value)}
            placeholder="Inventory"
            type="number"
            min="0"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
        >
          Add product
        </button>
      </form>
    </div>
  )}
</div>

);
}

function Customers({ data }: { data: NigeriaData }) {
const customers = useMemo(() => {
const map = new Map<
string,
{
id: string;
name: string;
phone: string;
city: string;
state: string;
orders: number;
spent: number;
}
>();

for (const order of data.orders) {
  const key = order.phone || order.customerName;
  const current = map.get(key);

  if (current) {
    current.orders += 1;
    current.spent += order.amount;
  } else {
    map.set(key, {
      id: key,
      name: order.customerName,
      phone: order.phone,
      city: order.city,
      state: order.state,
      orders: 1,
      spent: order.amount,
    });
  }
}

return Array.from(map.values());

}, [data.orders]);

return (
<div className="space-y-6">
<PageHeader eyebrow="Ecommerce Dashboard" title="Customers" description="Customer records calculated only from orders in this workspace." />

  <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    {customers.length === 0 ? (
      <div className="p-12 text-center">
        <Users size={34} className="mx-auto text-slate-300" />
        <p className="mt-4 font-bold">No customers yet</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Location</th>
              <th className="px-5 py-4">Orders</th>
              <th className="px-5 py-4">Spent</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-5 py-4">
                  <p className="font-bold">{customer.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {customer.phone}
                  </p>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {customer.city}, {customer.state}
                </td>

                <td className="px-5 py-4 font-semibold">
                  {customer.orders}
                </td>

                <td className="px-5 py-4 font-bold">
                  {money(customer.spent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
</div>

);
}

function Fulfillment({ data }: { data: NigeriaData }) {
const metrics = [
[
"Ready to fulfill",
data.orders.filter((order) => order.status === "ready_to_fulfill")
.length,
],
[
"Supplier ordered",
data.orders.filter((order) => order.status === "supplier_ordered")
.length,
],
[
"In transit",
data.orders.filter((order) => order.status === "shipped").length,
],
[
"Delivered",
data.orders.filter((order) => order.status === "delivered").length,
],
];

return (
<div className="space-y-6">
<PageHeader eyebrow="Ecommerce Dashboard" title="Fulfillment" description="Manage the fulfillment pipeline for this workspace." />

  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {metrics.map(([label, value]) => (
      <div
        key={String(label)}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black">{value}</p>
      </div>
    ))}
  </div>

  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="font-black">Fulfillment flow</h2>

    <p className="mt-2 text-sm text-slate-500">
      Payment confirmed → ready to fulfill → supplier ordered → shipped →
      delivered.
    </p>
  </section>
</div>

);
}

function Analytics({ data }: { data: NigeriaData }) {
return (
<div className="space-y-6">
<PageHeader eyebrow="Ecommerce Dashboard" title="Analytics" description="Analyze performance using data belonging only to this workspace." />

  <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
    <LineChart data={salesByDay(data.orders)} title="Sales performance" />
    <BarChart orders={data.orders} />
  </div>
</div>

);
}

function Payments({ data }: { data: NigeriaData }) {
const confirmed = data.orders.filter(
(order) => order.paymentStatus === "confirmed",
);

const pending = data.orders.filter(
(order) => order.paymentStatus === "pending",
);

const failed = data.orders.filter(
(order) => order.paymentStatus === "failed",
);

return (
<div className="space-y-6">
<PageHeader eyebrow="Ecommerce Dashboard" title="Payments" description="Payment activity for this ecommerce workspace." />

  <div className="grid gap-4 md:grid-cols-3">
    <MetricCard
      title="Confirmed"
      value={money(confirmed.reduce((sum, order) => sum + order.amount, 0))}
      subtitle={`${confirmed.length} orders`}
      icon={CheckCircle2}
    />

    <MetricCard
      title="Pending"
      value={money(pending.reduce((sum, order) => sum + order.amount, 0))}
      subtitle={`${pending.length} orders`}
      icon={CreditCard}
    />

    <MetricCard
      title="Failed"
      value={String(failed.length)}
      subtitle="Payment attempts"
      icon={WalletCards}
    />
  </div>
</div>

);
}

function Shipping({ data }: { data: NigeriaData }) {
return (
<div className="space-y-6">
<PageHeader eyebrow="Ecommerce Dashboard" title="Shipping" description="Manage delivery settings and fulfillment configuration." />

  <div className="grid gap-4 md:grid-cols-3">
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">Default fee</p>
      <p className="mt-2 font-black">{money(data.settings.shippingFee)}</p>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">Delivery estimate</p>
      <p className="mt-2 font-black">{data.settings.deliveryEstimate}</p>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">Supplier</p>
      <p className="mt-2 font-black">
        {data.settings.supplierName || "Not configured"}
      </p>
    </div>
  </div>
</div>

);
}

function Inventory({ data }: { data: NigeriaData }) {
const low = data.products.filter(
(product) => product.inventory > 0 && product.inventory <= 5,
).length;

const out = data.products.filter(
(product) => product.inventory <= 0,
).length;

return (
<div className="space-y-6">
<PageHeader eyebrow="Ecommerce Dashboard" title="Inventory" description="Monitor inventory belonging only to this ecommerce catalog." />

  <div className="grid gap-4 md:grid-cols-3">
    <MetricCard
      title="Products"
      value={String(data.products.length)}
      subtitle="Catalog"
      icon={Boxes}
    />

    <MetricCard
      title="Low stock"
      value={String(low)}
      subtitle="5 units or less"
      icon={Package}
    />

    <MetricCard
      title="Out of stock"
      value={String(out)}
      subtitle="Products"
      icon={PackageCheck}
    />
  </div>
</div>

);
}

function Stores({ data }: { data: NigeriaData }) {
const [copied, setCopied] = useState(false);

const storeUrl = `${window.location.origin}/nigeria-store`;

const copyStoreUrl = async () => {
try {
await navigator.clipboard.writeText(storeUrl);
setCopied(true);

  window.setTimeout(() => {
    setCopied(false);
  }, 1800);
} catch {
  setCopied(false);
}

};

const confirmedOrders = data.orders.filter(
(order) => order.paymentStatus === "confirmed",
);

const revenue = confirmedOrders.reduce(
(sum, order) => sum + order.amount,
0,
);

const profit = confirmedOrders.reduce(
(sum, order) => sum + order.profit,
0,
);

const activeProducts = data.products.filter(
(product) => product.active,
).length;

return (
<div className="space-y-6">
<PageHeader
eyebrow="Ecommerce Dashboard"
title="Stores"
description="Manage the storefront connected to this ecommerce workspace. Store data, orders, products, customers, and performance remain isolated from Global Ecommerce."
action={
<a href="/nigeria-store" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800" >
Open storefront
<ExternalLink size={16} />
</a>
}
/>

  <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 bg-slate-950 p-6 text-white sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <Store size={25} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">
                {data.settings.storeName || "Nigeria Ecommerce"}
              </h2>

              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                Active
              </span>
            </div>

            <p className="mt-2 text-sm text-white/60">
              Nigeria Ecommerce workspace
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70">
                Nigeria
              </span>

              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70">
                NGN
              </span>

              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70">
                Flutterwave
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyStoreUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
          >
            {copied ? (
              <CheckCircle2 size={16} />
            ) : (
              <ExternalLink size={16} />
            )}

            {copied ? "Copied" : "Copy store link"}
          </button>

          <a
            href="/nigeria-store"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
          >
            Visit store
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>

    <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
      <div className="bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Store URL
        </p>

        <p className="mt-2 truncate text-sm font-bold text-slate-950">
          /nigeria-store
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Public storefront
        </p>
      </div>

      <div className="bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Products
        </p>

        <p className="mt-2 text-2xl font-black text-slate-950">
          {activeProducts}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Active products
        </p>
      </div>

      <div className="bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Revenue
        </p>

        <p className="mt-2 text-2xl font-black text-slate-950">
          {money(revenue)}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Confirmed payments
        </p>
      </div>

      <div className="bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Profit
        </p>

        <p className="mt-2 text-2xl font-black text-slate-950">
          {money(profit)}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Confirmed order profit
        </p>
      </div>
    </div>
  </section>

  <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Store management
          </p>

          <h2 className="mt-1 text-lg font-black text-slate-950">
            Store operations
          </h2>
        </div>

        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Settings2 size={19} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("meo:command", {
                detail: {
                  workspace: "nigeria",
                  command: "open-store-settings",
                },
              }),
            );
          }}
          className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Settings2 size={18} className="text-slate-500" />

          <p className="mt-3 text-sm font-bold text-slate-950">
            Store settings
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Configure store identity, checkout, shipping, payments, and
            other workspace settings.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("meo:command", {
                detail: {
                  workspace: "nigeria",
                  command: "open-theme-editor",
                },
              }),
            );
          }}
          className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Palette size={18} className="text-slate-500" />

          <p className="mt-3 text-sm font-bold text-slate-950">
            Theme editor
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Customize the storefront design and presentation for this
            workspace.
          </p>
        </button>
      </div>
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        Store configuration
      </p>

      <h2 className="mt-1 text-lg font-black text-slate-950">
        Current setup
      </h2>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
          <span className="text-sm text-slate-500">Payment method</span>

          <span className="text-sm font-bold text-slate-900">
            {statusLabel(data.settings.paymentMethod)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
          <span className="text-sm text-slate-500">Shipping fee</span>

          <span className="text-sm font-bold text-slate-900">
            {money(data.settings.shippingFee)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
          <span className="text-sm text-slate-500">
            Delivery estimate
          </span>

          <span className="text-right text-sm font-bold text-slate-900">
            {data.settings.deliveryEstimate}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
          <span className="text-sm text-slate-500">Supplier</span>

          <span className="max-w-[55%] truncate text-right text-sm font-bold text-slate-900">
            {data.settings.supplierName || "Not configured"}
          </span>
        </div>
      </div>
    </section>
  </div>

  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Public storefront
        </p>

        <h2 className="mt-1 text-lg font-black text-slate-950">
          Share this store
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Use this storefront URL in your ads, social posts, and campaigns.
        </p>
      </div>

      <div className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
        <span className="min-w-0 flex-1 truncate px-2 text-xs font-medium text-slate-500">
          {storeUrl}
        </span>

        <button
          type="button"
          onClick={copyStoreUrl}
          className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  </section>
</div>

);
}

function Storefront() {
return (
<div className="space-y-6">
<PageHeader
eyebrow="Ecommerce Dashboard"
title="Storefront"
description="Manage and preview the storefront connected to this workspace."
action={
<a href="/nigeria-store" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white" >
Open store
<ExternalLink size={16} />
</a>
}
/>

  <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        Store URL
      </p>

      <p className="mt-2 font-bold">/nigeria-store</p>
    </div>

    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        Market
      </p>

      <p className="mt-2 font-bold">Nigeria</p>
    </div>

    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        Currency
      </p>

      <p className="mt-2 font-bold">NGN</p>
    </div>
  </section>
</div>

);
}

function ThemeEditor() {
const [theme, setTheme] = useState(
() => localStorage.getItem(THEME_KEY) || "Nigeria Classic",
);

const themes = [
"Nigeria Classic",
"Nigeria Commerce",
"Nigeria Minimal",
];

return (
<div className="space-y-6">
<PageHeader eyebrow="Ecommerce Dashboard" title="Theme Editor" description="Theme configuration is isolated from the Global Ecommerce workspace." />

  <div className="grid gap-4 md:grid-cols-3">
    {themes.map((item) => (
      <button
        key={item}
        type="button"
        onClick={() => {
          setTheme(item);
          localStorage.setItem(THEME_KEY, item);
        }}
        className={`rounded-3xl border p-6 text-left transition ${
          theme === item
            ? "border-slate-950 bg-slate-950 text-white"
            : "border-slate-200 bg-white"
        }`}
      >
        <Palette size={21} />

        <p className="mt-5 font-black">{item}</p>

        <p
          className={`mt-2 text-sm ${
            theme === item ? "text-white/60" : "text-slate-500"
          }`}
        >
          Storefront theme
        </p>
      </button>
    ))}
  </div>
</div>

);
}

export default function NigeriaAdmin() {
  const [page, setPage] = useState<PageKey>("Overview");
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("General");
  const [data, setData] = useState<NigeriaData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    const handleAiNavigation = (event: Event) => {
      const customEvent = event as CustomEvent<{ page?: string }>;
      const target = customEvent.detail?.page as PageKey | undefined;
      const allowed: PageKey[] = ["Overview", "Stores", "Orders", "Fulfillment", "Products", "Customers", "Analytics", "Payments", "Shipping", "Storefront", "Theme Editor", "Inventory", "Settings"];
      if (target && allowed.includes(target)) setPage(target);
    };
    window.addEventListener("meo:navigate", handleAiNavigation);
    return () => window.removeEventListener("meo:navigate", handleAiNavigation);
  }, []);

  function setOrders(orders: NigeriaOrder[]) {
    setData((current) => ({ ...current, orders }));
  }

  function addProduct(product: NigeriaProduct) {
    setData((current) => ({ ...current, products: [product, ...current.products] }));
  }

  function renderPage() {
    switch (page) {
      case "Overview": return <Overview data={data} />;
      case "Stores": return <Stores data={data} />;
      case "Orders": return <Orders data={data} setOrders={setOrders} />;
      case "Fulfillment": return <Fulfillment data={data} />;
      case "Products": return <Products data={data} addProduct={addProduct} />;
      case "Customers": return <Customers data={data} />;
      case "Analytics": return <Analytics data={data} />;
      case "Payments": return <Payments data={data} />;
      case "Shipping": return <Shipping data={data} />;
      case "Inventory": return <Inventory data={data} />;
      case "Storefront": return <Storefront />;
      case "Theme Editor": return <ThemeEditor />;
      case "Settings": return <WorkspaceSettings workspaceKey="nigeria" workspaceName="Nigeria Ecommerce" initialSection={settingsSection} />;
      default: return null;
    }
  }

  return (
    <AdminShell
      workspace="nigeria"
      active={page}
      onNavigate={(next) => setPage(next as PageKey)}
      settingsSection={settingsSection}
      onSettingsSectionChange={setSettingsSection}
      profileName="Store Owner"
    >
      {renderPage()}
    </AdminShell>
  );
}
