"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    salePrice: "",
    stock: "",
    image: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const admin = localStorage.getItem("ss-admin");
    if (!admin) {
      router.push("/admin/login");
      return;
    }
    
    async function fetchCats() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setForm(prev => ({ ...prev, category: data.categories[0].name }));
        }
      } catch (e) {
        console.error("Failed to fetch categories");
      }
    }
    fetchCats();
    setReady(true);
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setForm((prev) => ({ ...prev, image: data.url }));
    } catch (err: any) {
      setError("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) {
      setError("Please upload an image first");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          price: Number(form.price),
          salePrice: form.salePrice ? Number(form.salePrice) : null,
          stock: Number(form.stock),
          image: form.image,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  if (!ready) return <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div>
      <Link href="/admin/products" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px", textDecoration: "none" }}>
        <ArrowLeft size={16} />
        Back to Products
      </Link>

      <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "24px" }}>
        Add New Product
      </h1>

      <form onSubmit={handleSubmit} className="dz-card" style={{ padding: "24px", maxWidth: "800px" }}>
        {error && <div style={{ background: "#FEE", color: "#E74C3C", padding: "12px", borderRadius: "3px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Product Name *</label>
          <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Teddy Bear" className="dz-input" />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Description *</label>
          <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Product details..." className="dz-input" style={{ resize: "none" }} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Category *</label>
          <select required value={form.category} onChange={(e) => update("category", e.target.value)} className="dz-input">
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Price (Rs.) *</label>
            <input type="number" required value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="1000" className="dz-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Sale Price (optional)</label>
            <input type="number" value={form.salePrice} onChange={(e) => update("salePrice", e.target.value)} placeholder="999" className="dz-input" />
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Stock Quantity *</label>
          <input type="number" required value={form.stock} onChange={(e) => update("stock", e.target.value)} placeholder="50" className="dz-input" />
        </div>

        {/* IMAGE UPLOAD SECTION */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Product Image *</label>
          
          {form.image ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", border: "1px solid var(--border)", borderRadius: "3px", background: "var(--bg-alt)" }}>
              <img src={form.image} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "3px" }} />
              <div>
                <p style={{ fontSize: "13px", color: "#10B981", fontWeight: "500", marginBottom: "8px" }}>✓ Image uploaded</p>
                <button type="button" onClick={() => setForm(p => ({ ...p, image: "" }))} style={{ fontSize: "12px", color: "#E74C3C", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Remove & upload different
                </button>
              </div>
            </div>
          ) : (
            <div style={{ border: "2px dashed var(--border-strong)", borderRadius: "3px", padding: "32px", textAlign: "center", background: "var(--bg-alt)" }}>
              <Upload size={32} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>Click to upload product image</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: "none" }}
                id="image-upload"
              />
              <label htmlFor="image-upload" className="dz-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: uploading ? "wait" : "pointer" }}>
                {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Choose Image</>}
              </label>
            </div>
          )}
        </div>

        <button type="submit" disabled={saving || uploading} className="dz-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px" }}>
          <Save size={16} />
          {saving ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}