"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shirt,
  Smartphone,
  Gem,
  Home as HomeIcon,
  Sparkles,
  Dumbbell,
  ShoppingBasket,
  Baby,
  Star,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCart } from "@/lib/cart";

const iconMap: Record<string, any> = {
  Shirt,
  Smartphone,
  Gem,
  Home: HomeIcon,
  Sparkles,
  Dumbbell,
  ShoppingBasket,
  Baby,
};

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string;
  rating: number;
  reviews: number;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        setProducts(prodData.products || []);
        setCategories(catData.categories || []);
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* CATEGORY STRIP */}
      <div
        style={{
          background: "var(--surface)",
          padding: "16px 24px",
          display: "flex",
          gap: "24px",
          overflowX: "auto",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => setActiveCategory("All")}
          style={{
            background: "transparent",
            border: "none",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: activeCategory === "All" ? "700" : "500",
            color: activeCategory === "All" ? "var(--accent)" : "var(--text-secondary)",
            whiteSpace: "nowrap",
            borderBottom: activeCategory === "All" ? "2px solid var(--accent)" : "2px solid transparent",
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            style={{
              background: "transparent",
              border: "none",
              padding: "8px 12px",
              fontSize: "13px",
              fontWeight: activeCategory === cat.name ? "700" : "500",
              color: activeCategory === cat.name ? "var(--accent)" : "var(--text-secondary)",
              whiteSpace: "nowrap",
              borderBottom: activeCategory === cat.name ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <main style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* HERO SLIDER (Database se) */}
        <HeroSlider />

        {/* Shop by Category */}
        <section style={{ marginBottom: "32px" }}>
          <h2 className="dz-section-title">Shop by Category</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: "12px",
            }}
          >
            {categories.map((cat) => {
              const Icon = cat.icon ? iconMap[cat.icon] : null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className="dz-card dz-card-hover"
                  style={{ padding: "16px 8px", border: "none", textAlign: "center", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "var(--accent)" }}>
                    {Icon ? <Icon size={32} strokeWidth={1.5} /> : <span>📦</span>}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-primary)" }}>
                    {cat.name}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Products */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 className="dz-section-title" style={{ marginBottom: 0 }}>
              {activeCategory === "All" ? "Just For You" : activeCategory}
            </h2>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {filtered.length} products
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              Loading products...
            </div>
          ) : filtered.length === 0 ? (
            <div className="dz-card" style={{ padding: "60px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>No products in this category yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ background: "var(--surface)", padding: "32px 24px", marginTop: "40px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--accent)", marginBottom: "8px" }}>
            S.S Collection
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            © 2025 S.S Collection. All rights reserved. — Cash on Delivery Available
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ===== HERO SLIDER (Database se Image) ===== */
function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await fetch("/api/offers");
        const data = await res.json();
        setOffers(data.offers || []);
      } catch (e) {
        console.error("Failed to fetch offers:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, []);

  useEffect(() => {
    if (paused || offers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % offers.length);
    }, 30000);
    return () => clearInterval(timer);
  }, [paused, offers.length]);

  if (loading || offers.length === 0) return null;

  const next = () => setCurrent((prev) => (prev + 1) % offers.length);
  const prev = () => setCurrent((prev) => (prev - 1 + offers.length) % offers.length);
  const offer = offers[current];

  return (
    <section
      style={{
        position: "relative",
        borderRadius: "3px",
        overflow: "hidden",
        marginBottom: "24px",
        minHeight: "250px",
        background: "#f5f5f5",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
            {offer.image ? (
        <img
          src={offer.image}
          alt={offer.title}
          style={{ width: "100%", height: "100%", display: "block", minHeight: "250px", objectFit: "cover" }}
        />
      ) : (
        <div style={{ width: "100%", minHeight: "250px", background: "var(--bg-alt)" }} />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)",
          padding: "40px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "600px",
          color: "#fff",
        }}
      >
        <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px", color: "#fff" }}>
          {offer.title}
        </h1>
        {offer.subtitle && (
          <p style={{ fontSize: "16px", marginBottom: "20px", opacity: 0.95, color: "#fff" }}>
            {offer.subtitle}
          </p>
        )}
        <Link
          href={offer.ctaLink || "/"}
          style={{
            background: "var(--accent)",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: "3px",
            fontWeight: "700",
            fontSize: "14px",
            textDecoration: "none",
            alignSelf: "flex-start",
          }}
        >
          {offer.ctaText || "Shop Now"}
        </Link>
      </div>

      {offers.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.3)", border: "none", width: "40px", height: "40px", borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.3)", border: "none", width: "40px", height: "40px", borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </section>
  );
}

/* ===== PRODUCT CARD ===== */
function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      image: product.image,
    });
  };

  return (
    <div className="dz-card dz-card-hover" style={{ overflow: "hidden" }}>
      <Link href={`/product/${product.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: "var(--bg-alt)" }}>
          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {discount > 0 && (
            <span style={{ position: "absolute", top: "8px", left: "8px", background: "var(--accent)", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "2px" }}>
              -{discount}%
            </span>
          )}
        </div>
      </Link>

      <div style={{ padding: "12px" }}>
        <Link href={`/product/${product.id}`} style={{ textDecoration: "none", display: "block" }}>
          <h3 className="line-clamp-2" style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-primary)", marginBottom: "8px", minHeight: "36px", lineHeight: "18px" }}>
            {product.name}
          </h3>

          <div style={{ marginBottom: "8px" }}>
            {product.salePrice ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--accent)" }}>
                  Rs. {product.salePrice.toLocaleString()}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "line-through" }}>
                  Rs. {product.price.toLocaleString()}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--accent)" }}>
                Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>
            <Star size={12} style={{ fill: "#FFB800", color: "#FFB800" }} />
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{product.rating}</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>({product.reviews})</span>
          </div>
        </Link>

        <button
          onClick={handleAdd}
          className="dz-btn-primary"
          style={{ width: "100%", padding: "8px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}