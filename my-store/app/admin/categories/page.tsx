"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tag, AlertCircle, Layers } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const admin = localStorage.getItem("ss-admin");
    if (!admin) {
      router.push("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    fetchCategories();
  }, [ready]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e) {
      console.error("Failed to fetch categories:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const name = newCat.trim();
    if (!name) return;

    setSaving(true);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add category");

      setNewCat("");
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Ye database se permanently delete ho jayegi.`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert("Failed to delete category. Make sure the API route exists.");
    }
  };

  if (!ready) {
    return <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div className="admin-page-container">
      {/* HEADER */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "6px", letterSpacing: "-0.5px" }}>
          Manage Categories
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Layers size={16} /> {categories.length} categories in your store
        </p>
      </div>

      {/* ADD NEW CATEGORY FORM (Glassy Premium) */}
      <form onSubmit={handleAdd} className="admin-card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="e.g. Winter Collection, New Arrivals..."
            className="admin-input"
            style={{ flex: "1 1 250px", width: "100%" }}
          />
          <button
            type="submit"
            disabled={saving || !newCat.trim()}
            className="dz-btn-primary"
            style={{ 
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", 
              whiteSpace: "nowrap", flex: "0 0 auto", height: "42px", padding: "0 24px" 
            }}
          >
            <Plus size={18} />
            {saving ? "Adding..." : "Add Category"}
          </button>
        </div>
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", color: "#E74C3C", fontSize: "13px", background: "rgba(231, 76, 60, 0.1)", padding: "8px 12px", borderRadius: "6px" }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </form>

      {/* LIST SECTION */}
      {loading ? (
        <div className="admin-card" style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="admin-card" style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ background: "rgba(248, 86, 6, 0.1)", padding: "16px", borderRadius: "50%", marginBottom: "16px", color: "var(--accent)" }}>
            <Tag size={32} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
            No categories yet
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Add your first category above to get started.
          </p>
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          {categories.map((c, idx) => (
            <div
              key={c.id}
              className="category-item"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: idx < categories.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                transition: "background 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(248, 86, 6, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                  }}
                >
                  <Tag size={20} />
                </div>
                <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
                  {c.name}
                </span>
              </div>
              
              <button
                onClick={() => handleDelete(c.id, c.name)}
                aria-label="Delete"
                className="delete-btn"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(231, 76, 60, 0.05)",
                  border: "1px solid rgba(231, 76, 60, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#E74C3C",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PREMIUM CSS EFFECTS */}
      <style jsx>{`
        .admin-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
          border-radius: 12px;
          padding: 20px;
        }

        .category-item:hover {
          background: rgba(248, 86, 6, 0.02);
        }

        .delete-btn:hover {
          background: #E74C3C !important;
          color: #fff !important;
          border-color: #E74C3C !important;
        }

        @media (max-width: 768px) {
          .admin-page-container {
            padding: 0;
          }
          form {
            flex-direction: column;
            align-items: stretch;
          }
          input {
            min-width: 100% !important;
          }
          button[type="submit"] {
            width: 100%;
          }
          .category-item {
            padding: 14px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}