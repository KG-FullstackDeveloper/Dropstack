import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";

export default function Shop() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const categories = ["All", ...Array.from(new Set(products.map((product) => product.category)))];
  const filteredProducts = useMemo(() => products.filter((product) => (category === "All" || product.category === category) && product.name.toLowerCase().includes(search.toLowerCase())), [category, search]);

  return (
    <div className="bg-[#f6f3ec] text-[#171713]">
      <Navbar />
      <main className="min-h-screen">
        <section className="border-b border-black/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1440px]"><p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#817a6e]">The collection · {products.length} pieces</p><div className="mt-6 flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><h1 className="font-serif text-6xl tracking-[-0.05em] sm:text-7xl lg:text-8xl">Shop the edit.</h1><p className="max-w-md text-base leading-7 text-[#6e685f]">Purposeful objects selected for quality, utility, and a quieter kind of beauty.</p></div></div>
        </section>
        <section className="sticky top-[110px] z-30 border-b border-black/10 bg-[#f6f3ec]/95 px-5 py-4 backdrop-blur sm:px-8 lg:top-[110px] lg:px-12">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition ${category === item ? "border-[#171713] bg-[#171713] text-white" : "border-black/15 text-[#645f56] hover:border-black/50"}`}>{item}</button>)}</div>
            <div className="relative w-full lg:w-72"><Search size={17} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#817a6e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" className="w-full border-0 border-b border-black/25 bg-transparent py-2 pl-7 pr-8 text-sm outline-none placeholder:text-[#9b958b] focus:border-black" />{search && <button onClick={() => setSearch("")} className="absolute right-0 top-1/2 -translate-y-1/2" aria-label="Clear search"><X size={15} /></button>}</div>
          </div>
        </section>
        <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-10 flex items-center justify-between border-b border-black/10 pb-5"><p className="text-xs text-[#777168]">Showing {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}</p><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]"><SlidersHorizontal size={14} /> Curated order</span></div>
          {filteredProducts.length > 0 ? <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <div className="border border-black/10 py-24 text-center"><h2 className="font-serif text-3xl">Nothing found</h2><p className="mt-3 text-sm text-[#777168]">Try a different search or browse the full collection.</p><button onClick={() => { setSearch(""); setCategory("All"); }} className="mt-7 border-b border-black pb-1 text-xs font-bold uppercase tracking-widest">Reset filters</button></div>}
        </section>
      </main>
      <Footer />
    </div>
  );
}
