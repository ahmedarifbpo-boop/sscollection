"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Lock, Mail } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");

      // Login Success
      localStorage.setItem("ss-admin", JSON.stringify(data.admin));
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1B1B1C", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: "3px", padding: "40px 32px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "3px", background: "var(--accent)", marginBottom: "16px" }}>
            <Store size={28} style={{ color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#000", marginBottom: "4px" }}>S.S Collection</h1>
          <p style={{ fontSize: "12px", color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: "#FEE", color: "#E74C3C", padding: "10px", borderRadius: "3px", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@sscollection.pk" className="dz-input" style={{ paddingLeft: "36px" }} />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "6px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="dz-input" style={{ paddingLeft: "36px" }} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="dz-btn-primary" style={{ width: "100%", padding: "12px", display: "flex", justifyContent: "center" }}>
            {loading ? "Logging in..." : "Login to Admin Panel"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px" }}>
          <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>← Back to store</a>
        </div>
      </div>
    </div>
  );
}