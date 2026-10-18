"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search as SearchIcon, Star, ShoppingCart } from "lucide-react";
import { allProducts } from "@/lib/products";
import { useCart } from "@/lib/cart";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").toLowerCase().trim();

  const results = query
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      )
    : [];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-secondary)",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <SearchIcon size={22} style={{ color: "var(--accent)" }} />
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "500",
              color: "var(--text-primary)",
            }}
          >
            {query ? (
              <>
                Search results for{" "}
                <span style={{ color: "var(--accent)" }}>"{query}"</span>
              </>
            ) : (
              "Search"
            )}
            <span
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginLeft: "10px",
                fontWeight: "400",
              }}
            >
              ({results.length} {results.length === 1 ? "product" : "products"})
            </span>
          </h1>
        </div>

        {results.length === 0 ? (
          <div
            className="dz-card"
            style={{ padding: "60px 24px", textAlign: "center" }}
          >
            <SearchIcon
              size={64}
              style={{ color: "var(--border-strong)", marginBottom: "16px" }}
            />
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              No products found
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                marginBottom: "24px",
              }}
            >
              {query
                ? `We couldn't find anything for "${query}". Try different keywords.`
                : "Type something in the search bar to find products."}
            </p>
            <Link
              href="/"
              className="dz-btn-primary"
              style={{ display: "inline-block" }}
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {results.map((product) => (
              <SearchResultCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ product }: { product: any }) {
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
      <Link
        href={`/product/${product.id}`}
        style={{ textDecoration: "none", display: "block" }}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: "1 / 1",
            overflow: "hidden",
            background: "var(--bg-alt)",
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {discount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                background: "var(--accent)",
                color: "#fff",
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 8px",
                borderRadius: "2px",
              }}
            >
              -{discount}%
            </span>
          )}
        </div>
      </Link>
      <div style={{ padding: "12px" }}>
        <Link
          href={`/product/${product.id}`}
          style={{ textDecoration: "none", display: "block" }}
        >
          <h3
            className="line-clamp-2"
            style={{
              fontSize: "13px",
              fontWeight: "400",
              color: "var(--text-primary)",
              marginBottom: "8px",
              minHeight: "36px",
              lineHeight: "18px",
            }}
          >
            {product.name}
          </h3>
          <div style={{ marginBottom: "8px" }}>
            {product.salePrice ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--accent)" }}>
                  Rs. {product.salePrice.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    textDecoration: "line-through",
                  }}
                >
                  Rs. {product.price.toLocaleString()}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--accent)" }}>
                Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "10px",
            }}
          >
            <Star size={12} style={{ fill: "#FFB800", color: "#FFB800" }} />
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              {product.rating}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              ({product.reviews})
            </span>
          </div>
        </Link>
        <button
          onClick={handleAdd}
          className="dz-btn-primary"
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}