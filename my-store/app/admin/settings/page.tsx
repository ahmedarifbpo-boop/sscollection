"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Database, MessageSquare, Package, Image as ImageIcon } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [storageSize, setStorageSize] = useState("Loading...");

  // Form state
  const [form, setForm] = useState({
    storeName: "", contactEmail: "", contactPhone: "", address: "",
    freeShippingThreshold: "", shippingFee: "",
  });

  // Data lists for delete section
  const [chats, setChats] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    const admin = localStorage.getItem("ss-admin");
    if (!admin) { router.push("/admin/login"); return; }

    async function fetchData() {
      try {
        const [setRes, storeRes, chatRes, prodRes, offerRes] = await Promise.all([
          fetch("/api/settings"),
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

  // Save basic settings
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
      setSavedMsg("Settings saved!");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (e) { alert("Failed to save"); } finally { setSaving(false); }
  };

  // Delete functions
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
    <div style={{ maxWidth: "900px" }}>
      
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>Store Settings</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Manage store info and database data.</p>
      </div>

      {/* STORAGE STATUS CARD */}
      <div className="dz-card" style={{ padding: "20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "4px solid var(--accent)" }}>
        <div style={{ background: "var(--accent)15", padding: "12px", borderRadius: "50%", color: "var(--accent)" }}>
          <Database size={24} />
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>Database Storage Used</div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>{storageSize}</div>
        </div>
      </div>

      {/* BASIC SETTINGS FORM */}
      <form onSubmit={handleSaveSettings} className="dz-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Store Information</h2>
        {savedMsg && <div style={{ background: "#E8F8EE", color: "#10B981", padding: "12px", borderRadius: "3px", marginBottom: "16px", fontSize: "13px", fontWeight: "500" }}>✓ {savedMsg}</div>}
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>Store Name</label>
            <input type="text" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="dz-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="dz-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>Phone</label>
            <input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="dz-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="dz-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>Free Shipping Above (Rs.)</label>
            <input type="number" value={form.freeShippingThreshold} onChange={(e) => setForm({ ...form, freeShippingThreshold: e.target.value })} className="dz-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>Shipping Fee (Rs.)</label>
            <input type="number" value={form.shippingFee} onChange={(e) => setForm({ ...form, shippingFee: e.target.value })} className="dz-input" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="dz-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      {/* DATA MANAGEMENT SECTION */}
      <div className="dz-card" style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Trash2 size={18} color="#EF4444" /> Database Data Manager
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Delete specific data from the database to free up space.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          
          {/* CHATS */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><MessageSquare size={16} /> Customer Chats</h3>
            {chats.length === 0 ? <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No chats found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {chats.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-alt)", padding: "10px 12px", borderRadius: "3px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500" }}>{c.customerName} ({c.customerPhone})</span>
                    <button onClick={() => deleteChat(c.id, c.customerName)} style={{ color: "#EF4444", background: "transparent", border: "none", cursor: "pointer" }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCTS */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><Package size={16} /> Products</h3>
            {products.length === 0 ? <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No products found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                {products.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-alt)", padding: "10px 12px", borderRadius: "3px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{p.name}</span>
                    <button onClick={() => deleteProduct(p.id, p.name)} style={{ color: "#EF4444", background: "transparent", border: "none", cursor: "pointer" }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OFFERS */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><ImageIcon size={16} /> Banners / Offers</h3>
            {offers.length === 0 ? <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No banners found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                {offers.map((o) => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-alt)", padding: "10px 12px", borderRadius: "3px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{o.title}</span>
                    <button onClick={() => deleteOffer(o.id, o.title)} style={{ color: "#EF4444", background: "transparent", border: "none", cursor: "pointer" }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}