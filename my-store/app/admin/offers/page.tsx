"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";

interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export default function AdminOffersPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
  });

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
    fetchOffers();
  }, [ready]);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create offer");

      setForm({ title: "", subtitle: "", image: "" });
      await fetchOffers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 🔥 FIXED DELETE FUNCTION (Database se delete karega)
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this offer? Ye database se permanently delete ho jayega.")) return;

    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      // Database se delete hone ke baad UI se hatao
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      alert("Failed to delete offer from database. Check if API route exists.");
    }
  };

  if (!ready || loading) {
    return <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>
          Hero Slider Offers
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Manage the banners shown at the top of your homepage.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }} className="admin-offers-grid">
        
        {/* LEFT: ADD FORM */}
        <div className="dz-card" style={{ padding: "20px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> Add New Banner
          </h2>

          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: "#FEE", color: "#E74C3C", padding: "10px", borderRadius: "3px", marginBottom: "12px", fontSize: "12px" }}>{error}</div>}

            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Banner Image *</label>
            {form.image ? (
              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", border: "1px solid var(--border)", borderRadius: "3px", background: "var(--bg-alt)", marginBottom: "16px" }}>
                <img src={form.image} alt="Preview" style={{ width: "100px", height: "50px", objectFit: "cover", borderRadius: "3px" }} />
                <div>
                  <p style={{ fontSize: "12px", color: "#10B981", fontWeight: "500", marginBottom: "4px" }}>✓ Image Uploaded</p>
                  <button type="button" onClick={() => setForm(p => ({ ...p, image: "" }))} style={{ fontSize: "11px", color: "#E74C3C", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ border: "2px dashed var(--border-strong)", borderRadius: "3px", padding: "20px", textAlign: "center", background: "var(--bg-alt)", marginBottom: "16px" }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: "none" }} id="offer-image" />
                <label htmlFor="offer-image" style={{ cursor: uploading ? "wait" : "pointer", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                  {uploading ? <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)", marginBottom: "8px" }} /> : <Upload size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />}
                  <span style={{ fontSize: "13px", color: "var(--accent)", fontWeight: "500" }}>
                    {uploading ? "Uploading..." : "Click to upload banner image"}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Wide image (e.g. 1200x400) works best</span>
                </label>
              </div>
            )}

            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mega Sale is Live!" className="dz-input" style={{ marginBottom: "12px" }} />

            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Subtitle (optional)</label>
            <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. Up to 70% OFF" className="dz-input" style={{ marginBottom: "16px" }} />

            <button type="submit" disabled={saving || uploading || !form.image} className="dz-btn-primary" style={{ width: "100%", padding: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
              {saving ? "Adding Banner..." : "Add Banner"}
            </button>
          </form>
        </div>

        {/* RIGHT: LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {offers.length === 0 ? (
            <div className="dz-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No banners yet.</div>
          ) : (
            offers.map((offer) => (
              <div key={offer.id} className="dz-card" style={{ padding: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
                
                {/* Image Check lagaya hai crash se bachne ke liye */}
                {offer.image ? (
                  <img src={offer.image} alt={offer.title} style={{ width: "120px", height: "60px", objectFit: "cover", borderRadius: "3px", background: "#eee" }} />
                ) : (
                  <div style={{ width: "120px", height: "60px", background: "#eee", borderRadius: "3px" }} />
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>{offer.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{offer.subtitle || "No subtitle"}</div>
                </div>
                <button onClick={() => handleDelete(offer.id)} style={{ padding: "8px", color: "#EF4444", background: "transparent", border: "1px solid var(--border)", borderRadius: "3px", cursor: "pointer" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

      </div>

      <style jsx>{`
        @media (min-width: 900px) {
          .admin-offers-grid {
            grid-template-columns: 400px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}