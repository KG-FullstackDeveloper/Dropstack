import {
  Search,
  MoreHorizontal,
  PackageCheck,
} from "lucide-react";
import { useState } from "react";

const orders = [
  {
    id: "#ORD-1001",
    customer: "No orders yet",
    date: "—",
    total: "$0.00",
    payment: "Pending",
    status: "Payment pending",
  },
];

export default function Orders() {
  const [search, setSearch] = useState("");

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Orders
          </h1>
          <p className="mt-2 text-slate-500">
            Manage customer orders and fulfillment.
          </p>
        </div>

        <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Export orders
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <select className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none">
            <option>All orders</option>
            <option>Payment pending</option>
            <option>Settlement pending</option>
            <option>Ready to fulfill</option>
            <option>Shipped</option>
            <option>Delivered</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-slate-100"
                >
                  <td className="px-6 py-5 font-semibold text-slate-900">
                    {order.id}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600">
                    {order.customer}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-500">
                    {order.date}
                  </td>

                  <td className="px-6 py-5 text-sm font-semibold">
                    {order.total}
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                      {order.payment}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                      {order.status}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <button className="rounded-lg p-2 hover:bg-slate-100">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-12 text-center">
          <PackageCheck
            size={42}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 font-semibold text-slate-800">
            No customer orders yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            New orders will appear here automatically.
          </p>
        </div>
      </div>
    </div>
  );
}