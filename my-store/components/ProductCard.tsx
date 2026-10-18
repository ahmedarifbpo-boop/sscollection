"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/cart";

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  image: string;
  rating: number;
  reviews: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

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

    setAdded(true);
    setTimeout(() => setAdded(false), 2000); // 2 second baad wapas normal
  };

  return (
    <div className="dz-card dz-card-hover" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
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

      <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1 }}>
        <Link href={`/product/${product.id}`} style={{ textDecoration: "none", display: "block", flex: 1 }}>
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
          style={{
            width: "100%", padding: "8px", fontSize: "13px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            background: added ? "#10B981" : "var(--accent)", // Success color
            transition: "background 0.3s ease"
          }}
        >
          {added ? (
            <><Check size={14} /> Added!</>
          ) : (
            <><ShoppingCart size={14} /> Add to Cart</>
          )}
        </button>
      </div>
    </div>
  );
}