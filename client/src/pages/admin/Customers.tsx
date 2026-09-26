import {
  Search,
  Users,
  UserRound,
} from "lucide-react";

export default function Customers() {
  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold text-slate-950">
          Customers
        </h1>
        <p className="mt-2 text-slate-500">
          View and manage customers who purchase from your store.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <Card title="Total customers" value="0" />
        <Card title="New customers" value="0" />
        <Card title="Returning customers" value="0" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">
          <Search size={18} className="text-slate-400" />

          <input
            placeholder="Search customers..."
            className="w-full outline-none text-sm"
          />
        </div>

        <div className="p-14 text-center">
          <Users
            size={42}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 font-semibold text-slate-800">
            No customers yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Customers will automatically appear after their first purchase.
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <UserRound size={20} />

      <p className="mt-5 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}