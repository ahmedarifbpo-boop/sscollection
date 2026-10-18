"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tag, AlertCircle } from "lucide-react";

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

  // 🔥 NAYA DELETE FUNCTION (Database se delete karega)
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Ye database se permanently delete ho jayegi.`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      // UI se hatao
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert("Failed to delete category. Make sure the API route exists.");
    }
  };

  if (!ready) {
    return <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>
          Categories
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {categories.length} categories in your store
        </p>
      </div>

      {/* Add New */}
      <form onSubmit={handleAdd} className="dz-card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="e.g. New Arrivals, Winter Collection..."
            className="dz-input"
            style={{ flex: 1, minWidth: "200px" }}
          />
          <button
            type="submit"
            disabled={saving || !newCat.trim()}
            className="dz-btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
          >
            <Plus size={16} />
            {saving ? "Adding..." : "Add Category"}
          </button>
        </div>
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", color: "#E74C3C", fontSize: "12px" }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </form>

      {/* List */}
      {loading ? (
        <div className="dz-card" style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="dz-card" style={{ padding: "60px 24px", textAlign: "center" }}>
          <Tag size={48} style={{ color: "var(--border-strong)", marginBottom: "12px" }} />
          <h2 style={{ fontSize: "16px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "6px" }}>
            No categories yet
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Add your first category above.
          </p>
        </div>
      ) : (
        <div className="dz-card" style={{ overflow: "hidden" }}>
          {categories.map((c, idx) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: idx < categories.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "3px",
                    background: "var(--accent)15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                  }}
                >
                  <Tag size={16} />
                </div>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)" }}>
                  {c.name}
                </span>
              </div>
              <button
                onClick={() => handleDelete(c.id, c.name)}
                aria-label="Delete"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "3px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#E74C3C",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}