"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, LayoutGrid, ShoppingCart, ChevronDown } from "lucide-react";

const categories = [
  { name: "Fashion", slug: "fashion" },
  { name: "Electronics", slug: "electronics" },
  { name: "Jewellery", slug: "jewellery" },
  { name: "Home & Living", slug: "home-living" },
  { name: "Beauty", slug: "beauty" },
  { name: "Sports", slug: "sports" },
];

export default function Sidebar() {
  const [catOpen, setCatOpen] = useState(false);

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 w-20 lg:w-64 glass border-r border-white/5 z-40"
    >
      <nav className="p-4 space-y-2">

        {/* Home */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group"
          style={{ color: "var(--text)" }}
        >
          <Home size={20} className="group-hover:text-indigo-400 transition-colors" />
          <span className="hidden lg:inline text-sm font-medium">Home</span>
        </Link>

        {/* Category with dropdown */}
        <div>
          <button
            onClick={() => setCatOpen(!catOpen)}
            className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group"
            style={{ color: "var(--text)" }}
          >
            <div className="flex items-center gap-3">
              <LayoutGrid size={20} className="group-hover:text-indigo-400 transition-colors" />
              <span className="hidden lg:inline text-sm font-medium">Category</span>
            </div>
            <ChevronDown
              size={16}
              className={`hidden lg:block transition-transform duration-300 ${
                catOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {catOpen && (
            <div className="hidden lg:block mt-1 ml-6 pl-3 border-l border-white/10 space-y-1 dropdown-in">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="block px-3 py-2 rounded-lg text-sm opacity-60 hover:opacity-100 hover:bg-white/5 transition-all"
                  style={{ color: "var(--text)" }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Cart & Checkout */}
        <Link
          href="/cart"
          className="relative flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group"
          style={{ color: "var(--text)" }}
        >
          <ShoppingCart size={20} className="group-hover:text-indigo-400 transition-colors" />
          <span className="hidden lg:inline text-sm font-medium">Cart & Checkout</span>
          <span className="absolute top-2 right-2 lg:right-4 w-5 h-5 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center font-bold text-white">
            0
          </span>
        </Link>

      </nav>
    </aside>
  );
}