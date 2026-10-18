"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Admin check
  useEffect(() => {
    if (typeof window === "undefined") return;
    const admin = localStorage.getItem("ss-admin");
    if (!admin) router.push("/admin/login");
    else setReady(true);
  }, [router]);

  // Fetch products from database
  useEffect(() => {
    if (!ready) return;
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (e) {
        console.error("Failed to fetch:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [ready]);

  // Delete product
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? Ye database se permanently delete ho jayega.`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      
      // UI se hatao
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert("Product deleted.");
    } catch (e) {
      alert("Failed to delete product.");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!ready) {
    return <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>
            Products
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {products.length} products in your store
          </p>
        </div>
        <Link href="/admin/products/new" className="dz-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="dz-card" style={{ padding: "12px", marginBottom: "16px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name..."
          className="dz-input"
        />
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="dz-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading products...
        </div>
      ) : filtered.length === 0 ? (
        <div className="dz-card" style={{ padding: "60px 24px", textAlign: "center" }}>
          <Package size={48} style={{ color: "var(--border-strong)", marginBottom: "12px" }} />
          <h2 style={{ fontSize: "16px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "6px" }}>
            {search ? "No products match your search" : "No products yet"}
          </h2>
          <Link href="/admin/products/new" className="dz-btn-primary" style={{ display: "inline-flex", textDecoration: "none", marginTop: "16px" }}>
            + Add Product
          </Link>
        </div>
      ) : (
        <div className="dz-card" style={{ overflow: "hidden" }}>
          {/* Header Row (Desktop) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px 2fr 1fr 1fr 80px 100px",
              gap: "12px",
              padding: "12px 16px",
              background: "var(--bg-alt)",
              borderBottom: "1px solid var(--border)",
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            <div>Image</div>
            <div>Product</div>
            <div>Category</div>
            <div>Price</div>
            <div>Stock</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>

          {/* Rows */}
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 2fr 1fr 1fr 80px 100px",
                gap: "12px",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
              }}
            >
              {/* Image */}
              <div style={{ width: "48px", height: "48px", borderRadius: "3px", overflow: "hidden", background: "var(--bg-alt)" }}>
                <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>

              {/* Name */}
              <div className="line-clamp-1" style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>
                {p.name}
              </div>

              {/* Category */}
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {p.category}
              </div>

              {/* Price */}
              <div>
                {p.salePrice ? (
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent)" }}>
                      Rs. {p.salePrice.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "line-through" }}>
                      Rs. {p.price.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
                    Rs. {p.price.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Stock */}
              <div style={{ fontSize: "12px", color: p.stock > 0 ? "#2ECC71" : "#E74C3C", fontWeight: "500" }}>
                {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  style={{
                    width: "32px", height: "32px", borderRadius: "3px",
                    background: "var(--bg-alt)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-secondary)", textDecoration: "none"
                  }}
                >
                  <Pencil size={14} />
                </Link>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  style={{
                    width: "32px", height: "32px", borderRadius: "3px",
                    background: "var(--bg-alt)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#E74C3C", cursor: "pointer"
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}