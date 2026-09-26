export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <h2 className="text-xl font-bold">MEO Store</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
            Quality products sourced from trusted private suppliers
            and delivered to customers internationally.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Shop</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>Electronics</p>
            <p>Beauty & Skincare</p>
            <p>Pet Products</p>
            <p>Shapewear</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Shipping</h3>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Nigeria, Ghana and South Africa: 6–10 days.
            <br />
            US, UK and Australia: 10–14 days.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800 px-6 py-5 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} MEO Store. All rights reserved.
      </div>
    </footer>
  );
}