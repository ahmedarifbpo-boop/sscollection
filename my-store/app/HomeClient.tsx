"use client";

import { useState, useEffect } from "react"; // 👈 Yahan useEffect add kar diya hai
import Link from "next/link";
import Image from "next/image";
import { Shirt, Smartphone, Gem, Home as HomeIcon, Sparkles, Dumbbell, ShoppingBasket, Baby, Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

const iconMap: Record<string, any> = { Shirt, Smartphone, Gem, Home: HomeIcon, Sparkles, Dumbbell, ShoppingBasket, Baby };

interface Product {
  id: string; name: string; description: string; category: string; price: number; salePrice: number | null; stock: number; image: string; rating: number; reviews: number;
}
interface Category { id: string; name: string; icon: string | null; }
interface Offer { id: string; title: string; subtitle: string | null; image: string; ctaText: string; ctaLink: string; }

export default function HomeClient({ 
  initialProducts, 
  initialCategories, 
  initialOffers 
}: { 
  initialProducts: Product[], 
  initialCategories: Category[], 
  initialOffers: Offer[] 
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  
  const filtered = activeCategory === "All" ? initialProducts : initialProducts.filter((p) => p.category === activeCategory);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "60px" }}>
      {/* CATEGORY STRIP */}
      <div style={{ background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", padding: "12px 16px", display: "flex", gap: "20px", overflowX: "auto", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", scrollbarWidth: "none" }}>
        <button onClick={() => setActiveCategory("All")} style={{ background: "none", border: "none", fontWeight: activeCategory === "All" ? "700" : "500", color: activeCategory === "All" ? "var(--accent)" : "#555", borderBottom: activeCategory === "All" ? "2px solid var(--accent)" : "2px solid transparent", paddingBottom: "4px" }}>All</button>
        {initialCategories.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.name)} style={{ background: "none", border: "none", fontWeight: activeCategory === cat.name ? "700" : "500", color: activeCategory === cat.name ? "var(--accent)" : "#555", borderBottom: activeCategory === cat.name ? "2px solid var(--accent)" : "2px solid transparent", paddingBottom: "4px" }}>{cat.name}</button>
        ))}
      </div>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "16px" }}>
        
        {/* HERO SLIDER */}
        <HeroSlider offers={initialOffers} />

        {/* Shop by Category */}
        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>Shop by Category</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))", gap: "10px" }}>
            {initialCategories.map((cat) => {
              const Icon = cat.icon ? iconMap[cat.icon] : null;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.name)} className="glass-panel" style={{ padding: "12px 6px", border: "none", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{ color: "var(--accent)" }}>{Icon ? <Icon size={24} strokeWidth={1.5} /> : <span>📦</span>}</div>
                  <div style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-primary)" }}>{cat.name}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Products */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>{activeCategory === "All" ? "Just For You" : activeCategory}</h2>
            <span style={{ fontSize: "12px", color: "#777" }}>{filtered.length} items</span>
          </div>

          {filtered.length === 0 ? (
            <div className="dz-card" style={{ padding: "40px", textAlign: "center" }}>No products found.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
              {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </section>
      </main>

      <footer style={{ background: "var(--surface)", padding: "24px", marginTop: "32px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--accent)" }}>S.S Collection</div>
        <p style={{ fontSize: "12px", color: "#777", marginTop: "8px" }}>© 2025 S.S Collection. All rights reserved.</p>
      </footer>
    </div>
  );
}

/* ===== HERO SLIDER ===== */
function HeroSlider({ offers }: { offers: Offer[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % offers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [offers.length]);

  if (offers.length === 0) return null;
  const offer = offers[current];

  return (
    <section className="dz-card" style={{ position: "relative", overflow: "hidden", marginBottom: "20px", borderRadius: "12px" }}>
      {offer.image && (
        <Image 
          src={offer.image} 
          alt="Banner" 
          width={1200} 
          height={400} 
          priority 
          // 👇 width 100% aur height auto se banner stretch nahi hoga
          style={{ width: "100%", height: "auto", display: "block" }} 
        />
      )}
    </section>
  );
}

/* ===== PRODUCT CARD ===== */
function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

  return (
    <div className="dz-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Link href={`/product/${product.id}`} style={{ position: "relative", display: "block", aspectRatio: "1/1", background: "#f5f5f5" }}>
        <Image 
          src={product.image} 
          alt={product.name} 
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          style={{ objectFit: "cover" }} 
        />
        {discount > 0 && (
          <span style={{ position: "absolute", top: "6px", left: "6px", background: "var(--accent)", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", zIndex: 10 }}>-{discount}%</span>
        )}
      </Link>
      <div style={{ padding: "10px", display: "flex", flexDirection: "column", flex: 1 }}>
        <Link href={`/product/${product.id}`} style={{ flex: 1 }}>
          <h3 className="line-clamp-2" style={{ fontSize: "12px", fontWeight: "500", marginBottom: "6px", lineHeight: "1.3", minHeight: "32px" }}>{product.name}</h3>
          <div style={{ marginBottom: "6px" }}>
            {product.salePrice ? (
              <div style={{ display: "flex", gap: "4px", alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent)" }}>Rs. {product.salePrice.toLocaleString()}</span>
                <span style={{ fontSize: "10px", color: "#999", textDecoration: "line-through" }}>Rs. {product.price.toLocaleString()}</span>
              </div>
            ) : (
              <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent)" }}>Rs. {product.price.toLocaleString()}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
            <Star size={10} style={{ fill: "#FFB800", color: "#FFB800" }} />
            <span style={{ fontSize: "10px", color: "#555" }}>{product.rating} ({product.reviews})</span>
          </div>
        </Link>
        <button onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, salePrice: product.salePrice, image: product.image })} className="dz-btn-primary" style={{ width: "100%", padding: "6px", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
          <ShoppingCart size={12} /> Add to Cart
        </button>
      </div>
    </div>
  );
}