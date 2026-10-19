"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, ShoppingCart, Minus, Plus, Truck, ShieldCheck, RotateCcw, Check
} from "lucide-react";
import { useCart } from "@/lib/cart";

interface Product {
  id: string; name: string; description: string; category: string;
  price: number; salePrice: number | null; stock: number; image: string; rating: number; reviews: number;
}

function ProductContent() {
  const params = useParams();
  const id = params.id as string;

  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const [shippingFee, setShippingFee] = useState(250);
  const [freeThreshold, setFreeThreshold] = useState(5000);
  const [enableFreeShipping, setEnableFreeShipping] = useState(true);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          setShippingFee(d.settings.shippingFee || 250);
          setFreeThreshold(d.settings.freeShippingThreshold || 5000);
          setEnableFreeShipping(d.settings.enableFreeShipping ?? true);
        }
      });

    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        const data = await res.json();
        const prod = data.product;
        setProduct(prod);

        const allRes = await fetch("/api/products");
        const allData = await allRes.json();
        const filtered = (allData.products || []).filter(
          (p: Product) => p.category === prod.category && p.id !== prod.id
        );
        setRelated(filtered.slice(0, 4));
      } catch (e) {
        console.error("Failed to load product:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div style={{ padding: "60px", textAlign: "center" }}>Loading...</div>;
  if (notFound || !product) return <div style={{ padding: "60px", textAlign: "center" }}>Product not found</div>;

  const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
  const finalPrice = product.salePrice || product.price;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id, name: product.name, price: product.price, salePrice: product.salePrice, image: product.image,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="dz-card product-detail-grid" style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
          
          <div>
            <div style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", borderRadius: "3px", background: "var(--bg-alt)" }}>
              <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {discount > 0 && (
                <span style={{ position: "absolute", top: "12px", left: "12px", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: "700", padding: "4px 10px", borderRadius: "2px" }}>
                  -{discount}% OFF
                </span>
              )}
            </div>
          </div>

          <div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              {product.category}
            </p>

            <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)", lineHeight: "30px", marginBottom: "12px" }}>
              {product.name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: "2px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} style={{ fill: s <= Math.round(product.rating) ? "#FFB800" : "transparent", color: "#FFB800" }} />
                ))}
              </div>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{product.rating}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>({product.reviews} reviews)</span>
            </div>

            <div style={{ background: "var(--bg-alt)", padding: "16px", borderRadius: "3px", marginBottom: "20px" }}>
              {product.salePrice ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "28px", fontWeight: "700", color: "var(--accent)" }}>Rs. {product.salePrice.toLocaleString()}</span>
                    <span style={{ fontSize: "14px", color: "var(--text-muted)", textDecoration: "line-through" }}>Rs. {product.price.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "500" }}>
                    You save Rs. {(product.price - product.salePrice).toLocaleString()}
                  </div>
                </>
              ) : (
                <span style={{ fontSize: "28px", fontWeight: "700", color: "var(--accent)" }}>Rs. {product.price.toLocaleString()}</span>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "8px" }}>Description</h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "22px" }}>{product.description}</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "8px" }}>Quantity</label>
              <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--border-strong)", borderRadius: "3px", background: "var(--surface)" }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: "10px 14px", background: "transparent", border: "none", color: "var(--text-secondary)" }}><Minus size={16} /></button>
                <span style={{ fontSize: "15px", fontWeight: "500", minWidth: "40px", textAlign: "center" }}>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} style={{ padding: "10px 14px", background: "transparent", border: "none", color: "var(--text-secondary)" }}><Plus size={16} /></button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="dz-btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}
            >
              {added ? <><Check size={18} /> Added to Cart!</> : <><ShoppingCart size={18} /> Add to Cart — Rs. {(finalPrice * quantity).toLocaleString()}</>}
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <div style={{ textAlign: "center" }}>
                <Truck size={20} style={{ color: "var(--accent)", marginBottom: "6px" }} />
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "15px" }}>Fast Delivery</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <ShieldCheck size={20} style={{ color: "var(--accent)", marginBottom: "6px" }} />
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "15px" }}>Cash on Delivery</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <RotateCcw size={20} style={{ color: "var(--accent)", marginBottom: "6px" }} />
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "15px" }}>Easy Returns</div>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "16px", textAlign: "center", background: "var(--bg-alt)", padding: "10px", borderRadius: "3px" }}>
              🚚 Shipping: <strong>{shippingFee === 0 ? "Free" : `Rs. ${shippingFee}`}</strong> 
              {enableFreeShipping && freeThreshold > 0 && ` (Free delivery on orders above Rs. ${freeThreshold.toLocaleString()})`}
            </div>

          </div>
        </div>

        {related.length > 0 && (
          <section style={{ marginTop: "32px" }}>
            <h2 className="dz-section-title">You may also like</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
              {related.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="dz-card dz-card-hover" style={{ overflow: "hidden", display: "block", textDecoration: "none" }}>
                  <div style={{ aspectRatio: "1 / 1", overflow: "hidden", background: "var(--bg-alt)" }}>
                    <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "10px" }}>
                    <h3 className="line-clamp-2" style={{ fontSize: "12px", marginBottom: "6px", minHeight: "32px" }}>{p.name}</h3>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent)" }}>Rs. {(p.salePrice || p.price).toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px", textAlign: "center" }}>Loading...</div>}>
      <ProductContent />
    </Suspense>
  );
}