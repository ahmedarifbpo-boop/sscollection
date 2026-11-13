
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  ChevronDown,
  X,
} from "lucide-react";
import { useCart } from "@/lib/cart";

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
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="site-sidebar">
        <nav className="site-sidebar-nav">
          <Link
            href="/"
            className={`sidebar-link ${pathname === "/" ? "active" : ""}`}
          >
            <Home size={20} />
            <span>Home</span>
          </Link>

          <button
            type="button"
            onClick={() => setCatOpen(!catOpen)}
            className="sidebar-link sidebar-category-button"
            aria-expanded={catOpen}
          >
            <LayoutGrid size={20} />
            <span>Category</span>
            <ChevronDown
              size={16}
              className={catOpen ? "sidebar-chevron open" : "sidebar-chevron"}
            />
          </button>

          {catOpen && (
            <div className="sidebar-categories">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="sidebar-category-link"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/cart"
            className={`sidebar-link ${pathname === "/cart" ? "active" : ""}`}
          >
            <ShoppingCart size={20} />
            <span>Cart & Checkout</span>
            {totalItems > 0 && (
              <span className="sidebar-cart-count">{totalItems}</span>
            )}
          </Link>
        </nav>
      </aside>

      {/* Mobile Categories Panel */}
      {catOpen && (
        <div className="mobile-category-panel">
          <div className="mobile-category-heading">
            <strong>Categories</strong>
            <button
              type="button"
              onClick={() => setCatOpen(false)}
              aria-label="Close categories"
            >
              <X size={20} />
            </button>
          </div>

          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              onClick={() => setCatOpen(false)}
              className="mobile-category-link"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link href="/" className={pathname === "/" ? "active" : ""}>
          <Home size={21} />
          <span>Home</span>
        </Link>

        <button
          type="button"
          onClick={() => setCatOpen(!catOpen)}
          className={catOpen ? "active" : ""}
        >
          <LayoutGrid size={21} />
          <span>Categories</span>
        </button>

        <Link href="/cart" className={pathname === "/cart" ? "active" : ""}>
          <span className="mobile-cart-icon">
            <ShoppingCart size={21} />
            {totalItems > 0 && (
              <span className="mobile-cart-count">{totalItems}</span>
            )}
          </span>
          <span>Cart</span>
        </Link>
      </nav>
    </>
  );
}
