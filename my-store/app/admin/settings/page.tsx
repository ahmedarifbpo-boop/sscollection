"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Database, MessageSquare, Package, Image as ImageIcon, Upload, Loader2, Store, Truck, ShieldAlert } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [storageSize, setStorageSize] = useState("Loading...");

  // Purane saare form fields + naya logoUrl
  const [form, setForm] = useState({
    storeName: "", contactEmail: "", contactPhone: "", address: "",
    freeShippingThreshold: "", shippingFee: "", enableFreeShipping: true,
    logoUrl: "",
  });

  const [chats, setChats] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    const admin = localStorage.getItem("ss-admin");
    if (!admin) { router.push("/admin/login"); return; }

    async function fetchData() {
      try {
        const [setRes, storeRes, chatRes, prodRes, offerRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/storage"),
          fetch("/api/admin-chat"),
          fetch("/api/products"),
          fetch("/api/offers")
        ]);

        const setData = await setRes.json();
        const storeData = await storeRes.json();
        const chatData = await chatRes.json();
        const prodData = await prodRes.json();
        const offerData = await offerRes.json();

        if (setData.settings) {
          setForm({
            storeName: setData.settings.storeName || "",
            contactEmail: setData.settings.contactEmail || "",
            contactPhone: setData.settings.contactPhone || "",
            address: setData.settings.address || "",
            freeShippingThreshold: setData.settings.freeShippingThreshold.toString() || "5000",
            shippingFee: setData.settings.shippingFee.toString() || "250",
            enableFreeShipping: setData.settings.enableFreeShipping ?? true,
            logoUrl: setData.settings.logoUrl || "",
          });
        }

        setStorageSize(storeData.size || "0 MB");
        setChats(chatData.conversations || []);
        setProducts(prodData.products || []);
        setOffers(offerData.offers || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setReady(true);
      }
    }
    fetchData();
  }, [router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (err) {
      alert("Logo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSavedMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          freeShippingThreshold: Number(form.freeShippingThreshold),
          shippingFee: Number(form.shippingFee),
        }),
      });
      if (!res.ok) throw new Error();
      setSavedMsg("Settings saved successfully!");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (e) { alert("Failed to save"); } finally { setSaving(false); }
  };

  const deleteChat = async (id: string, name: string) => {
    if (!confirm(`Delete chat with ${name}?`)) return;
    await fetch(`/api/admin-chat/${id}`, { method: "DELETE" });
    setChats((prev) => prev.filter((c) => c.id !== id));
  };
  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete product "${name}"?`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };
  const deleteOffer = async (id: string, name: string) => {
    if (!confirm(`Delete banner "${name}"?`)) return;
    await fetch(`/api/offers/${id}`, { method: "DELETE" });
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  if (!ready || loading) return <div style={{ padding: "60px", textAlign: "center" }}>Loading...</div>;

  return (
    <div className="admin-page-container" style={{ maxWidth: "900px" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: "6px" }}>
          Store Settings
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Manage your store information, logo, shipping, and database.
        </p>
      </div>

      {/* DATABASE STORAGE CARD */}
      <div className="admin-card" style={{ padding: "20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "4px solid var(--accent)" }}>
        <div style={{ background: "rgba(248, 86, 6, 0.1)", padding: "14px", borderRadius: "50%", color: "var(--accent)" }}>
          <Database size={24} />
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Database Storage Used</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)" }}>{storageSize}</div>
        </div>
      </div>

      {/* SETTINGS FORM */}
      <form onSubmit={handleSaveSettings} className="admin-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Store size={20} color="var(--accent)" /> Store Information
        </h2>
        
        {savedMsg && (
          <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "600", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            ✓ {savedMsg}
          </div>
        )}
        
        {/* LOGO UPLOAD SECTION */}
        <div style={{ marginBottom: "24px", padding: "20px", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px dashed rgba(0,0,0,0.1)" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "var(--text-secondary)" }}>Website Logo</label>
          {form.logoUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ background: "#fff", padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <img src={form.logoUrl} alt="Logo" style={{ height: "60px", objectFit: "contain", display: "block" }} />
              </div>
              <button type="button" onClick={() => setForm({ ...form, logoUrl: "" })} style={{ fontSize: "13px", color: "#EF4444", background: "rgba(239, 68, 68, 0.1)", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600" }}>
                Remove Logo
              </button>
            </div>
          ) : (
            <div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} style={{ display: "none" }} id="logo-upload" />
              <label htmlFor="logo-upload" className="dz-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "#fff", border: "1px solid var(--border)", padding: "10px 20px" }}>
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {uploading ? "Uploading..." : "Upload New Logo"}
              </label>
            </div>
          )}
        </div>

        {/* FORM FIELDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>Store Name</label>
            <input type="text" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>Phone</label>
            <input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="admin-input" />
          </div>
        </div>

        {/* SHIPPING SETTINGS */}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "24px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Truck size={18} color="var(--accent)" /> Shipping Settings
          </h3>
          
          <div style={{ marginBottom: "16px", padding: "16px", background: "rgba(248, 86, 6, 0.05)", borderRadius: "8px", border: "1px solid rgba(248, 86, 6, 0.1)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.enableFreeShipping} onChange={(e) => setForm({ ...form, enableFreeShipping: e.target.checked })} style={{ width: "20px", height: "20px", accentColor: "var(--accent)", cursor: "pointer" }} />
              <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Enable Free Shipping Feature</span>
            </label>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>Free Shipping Above (Rs.)</label>
              <input type="number" value={form.freeShippingThreshold} onChange={(e) => setForm({ ...form, freeShippingThreshold: e.target.value })} className="admin-input" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>Standard Shipping Fee (Rs.)</label>
              <input type="number" value={form.shippingFee} onChange={(e) => setForm({ ...form, shippingFee: e.target.value })} className="admin-input" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="dz-btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", fontSize: "15px" }}>
          <Save size={18} /> {saving ? "Saving Changes..." : "Save All Settings"}
        </button>
      </form>

      {/* DATABASE MANAGER */}
      <div className="admin-card" style={{ padding: "24px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", color: "#EF4444" }}>
          <ShieldAlert size={20} /> Database Data Manager
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
          Delete specific data from the database to free up space. This action cannot be undone.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          
          {/* CHATS */}
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
              <MessageSquare size={16} /> Customer Chats
            </h3>
            {chats.length === 0 ? <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No chats found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {chats.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.04)" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{c.customerName} ({c.customerPhone})</span>
                    <button onClick={() => deleteChat(c.id, c.customerName)} style={{ color: "#EF4444", background: "rgba(239, 68, 68, 0.1)", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCTS */}
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
              <Package size={16} /> Products
            </h3>
            {products.length === 0 ? <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No products found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto", paddingRight: "4px" }}>
                {products.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.04)" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{p.name}</span>
                    <button onClick={() => deleteProduct(p.id, p.name)} style={{ color: "#EF4444", background: "rgba(239, 68, 68, 0.1)", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OFFERS */}
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
              <ImageIcon size={16} /> Banners / Offers
            </h3>
            {offers.length === 0 ? <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No banners found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto", paddingRight: "4px" }}>
                {offers.map((o) => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.04)" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{o.title}</span>
                    <button onClick={() => deleteOffer(o.id, o.title)} style={{ color: "#EF4444", background: "rgba(239, 68, 68, 0.1)", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM SCROLLBAR FOR DATABASE LISTS */}
      <style jsx>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}