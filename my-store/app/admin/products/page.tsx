
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Image as ImageIcon,
  Video,
  Star,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string;
  images?: string[];
  video?: string | null;
  rating?: number;
  reviews?: number;
}

export default function AdminProductsPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Verify admin session
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch("/api/admin/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (cancelled) return;

        if (res.status === 401 || !data.authenticated) {
          router.replace("/admin/login");
          return;
        }

        setReady(true);
      } catch (error) {
        console.error("Admin session check failed:", error);

        if (!cancelled) {
          setMessage("Session verify nahi ho saka. Page refresh karein.");
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Fetch products
  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function fetchProducts() {
      try {
        const res = await fetch("/api/products", {
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();

        if (!cancelled) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Product fetch error:", error);

        if (!cancelled) {
          setMessage("Products load nahi ho sake.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [ready, router]);

  // Delete product
  const handleDelete = async (id: string, name: string) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Delete "${name}"? Ye database se permanently delete ho jayega.`
    );

    if (!confirmed) return;

    const previousProducts = products;

    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(id);
    setMessage("");

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setMessage("Product successfully deleted.");

      const refresh = await fetch("/api/products", {
        credentials: "include",
        cache: "no-store",
      });

      if (refresh.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (refresh.ok) {
        const latestData = await refresh.json();
        setProducts(latestData.products || []);
      }
    } catch (error) {
      setProducts(previousProducts);

      setMessage(
        error instanceof Error
          ? error.message
          : "Product delete nahi ho saka."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!ready) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "500",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Products
          </h1>

          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {products.length} products in your store
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="dz-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
          }}
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Status Message */}
      {message && (
        <div
          style={{
            padding: "12px",
            marginBottom: "16px",
            borderRadius: "4px",
            background: "var(--bg-alt)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        >
          {message}
        </div>
      )}

      {/* Search */}
      <div
        className="dz-card"
        style={{ padding: "12px", marginBottom: "16px" }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name..."
          className="dz-input"
        />
      </div>

      {/* Products */}
      {loading ? (
        <div
          className="dz-card"
          style={{
            padding: "60px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Loading products...
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="dz-card"
          style={{ padding: "60px 24px", textAlign: "center" }}
        >
          <Package
            size={48}
            style={{
              color: "var(--border-strong)",
              marginBottom: "12px",
            }}
          />

          <h2
            style={{
              fontSize: "16px",
              fontWeight: "500",
              color: "var(--text-primary)",
              marginBottom: "6px",
            }}
          >
            {search ? "No products match your search" : "No products yet"}
          </h2>

          <Link
            href="/admin/products/new"
            className="dz-btn-primary"
            style={{
              display: "inline-flex",
              textDecoration: "none",
              marginTop: "16px",
            }}
          >
            + Add Product
          </Link>
        </div>
      ) : (
        <div className="dz-card" style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "850px" }}>
            {/* Header Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 2fr 1fr 1fr 80px 120px",
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

            {/* Product Rows */}
            {filtered.map((p) => {
              const imageCount =
                p.images && p.images.length > 0
                  ? p.images.length
                  : p.image
                    ? 1
                    : 0;

              const mainImage = p.image || p.images?.[0] || "";

              return (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 2fr 1fr 1fr 80px 120px",
                    gap: "12px",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    alignItems: "center",
                    opacity: deletingId === p.id ? 0.5 : 1,
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "3px",
                      overflow: "hidden",
                      background: "var(--bg-alt)",
                    }}
                  >
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>

                  {/* Product */}
                  <div>
                    <div
                      className="line-clamp-1"
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "var(--text-primary)",
                      }}
                    >
                      {p.name}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginTop: "5px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <ImageIcon size={11} />
                        {imageCount} images
                      </span>

                      {p.video && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#2ECC71",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <Video size={11} />
                          Video
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Star size={11} />
                        {(p.rating ?? 0).toFixed(1)} ({p.reviews ?? 0})
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {p.category}
                  </div>

                  {/* Price */}
                  <div>
                    {p.salePrice ? (
                      <>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "var(--accent)",
                          }}
                        >
                          Rs. {p.salePrice.toLocaleString()}
                        </div>

                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            textDecoration: "line-through",
                          }}
                        >
                          Rs. {p.price.toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                        }}
                      >
                        Rs. {p.price.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Stock */}
                  <div
                    style={{
                      fontSize: "12px",
                      color: p.stock > 0 ? "#2ECC71" : "#E74C3C",
                      fontWeight: "500",
                    }}
                  >
                    {p.stock > 0
                      ? `${p.stock} in stock`
                      : "Out of stock"}
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "6px",
                    }}
                  >
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      title="Edit product"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "3px",
                        background: "var(--bg-alt)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                      }}
                    >
                      <Pencil size={14} />
                    </Link>

                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId !== null}
                      title="Delete product"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "3px",
                        background: "var(--bg-alt)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#E74C3C",
                        cursor: deletingId
                          ? "not-allowed"
                          : "pointer",
                        opacity: deletingId ? 0.5 : 1,
                      }}
                    >
                      {deletingId === p.id ? (
                        <span style={{ fontSize: "10px" }}>...</span>
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
