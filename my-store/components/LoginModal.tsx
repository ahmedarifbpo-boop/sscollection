"use client";

import { useState } from "react";
import { X, Mail, Phone } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }: Props) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Login Success: Save to localStorage and reload
      localStorage.setItem("ss-customer", JSON.stringify(data.customer));
      window.location.reload(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.5)",
      }}
      className="fade-in"
      onClick={onClose}
    >
      <div
        className="modal-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "6px",
          width: "100%",
          maxWidth: "420px",
          padding: "24px",
          position: "relative",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            padding: "8px",
            borderRadius: "3px",
            color: "#999",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "600", color: "#1B1B1C", marginBottom: "6px" }}>
            Welcome back
          </h2>
          <p style={{ fontSize: "14px", color: "#6B7280" }}>
            Enter your email and phone to login
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: "#FEE", color: "#EF4444", padding: "10px", borderRadius: "4px", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
            Email Address
          </label>
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="dz-input"
              style={{ paddingLeft: "36px" }}
            />
          </div>

          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
            Phone Number
          </label>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <Phone size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="dz-input"
              style={{ paddingLeft: "36px" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="dz-btn-primary"
            style={{ width: "100%", padding: "12px" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Switch */}
        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#6B7280" }}>
          Don&apos;t have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--accent)",
              fontWeight: "600",
              fontSize: "13px",
              padding: 0,
              cursor: "pointer",
            }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}