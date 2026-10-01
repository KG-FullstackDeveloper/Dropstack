import { ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";

import Admin from "./Admin";

export default function AdminWorkspace() {
  return (
    <div className="relative min-h-screen">
      <Admin />

      <Link
        to="/nigeria-store"
        className="fixed right-4 top-4 z-[100] inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-bold text-neutral-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:right-6 sm:top-5"
      >
        <ArrowLeftRight size={17} />
        <span className="hidden sm:inline">Nigeria Store</span>
        <span className="sm:hidden">Nigeria</span>
      </Link>
    </div>
  );
}
