import {
  CreditCard,
  CheckCircle2,
  Clock3,
  Wallet,
} from "lucide-react";

export default function Payments() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-950">
        Payments
      </h1>

      <p className="mt-2 text-slate-500">
        Monitor customer payments and settlement status.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <PaymentCard
          icon={CreditCard}
          title="Customer payments"
          value="$0.00"
        />

        <PaymentCard
          icon={Clock3}
          title="Settlement pending"
          value="$0.00"
        />

        <PaymentCard
          icon={CheckCircle2}
          title="Available to fulfill"
          value="$0.00"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <Wallet size={20} />

          <div>
            <h2 className="font-bold">
              Flutterwave payments
            </h2>

            <p className="text-sm text-slate-500">
              Payment transactions will appear here.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-slate-50 p-10 text-center">
          <p className="text-sm text-slate-500">
            No payment transactions yet.
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof CreditCard;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <Icon size={21} />

      <p className="mt-5 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}