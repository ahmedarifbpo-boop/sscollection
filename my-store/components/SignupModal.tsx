"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }: Props) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;
    setSubmitted(true);
    setTimeout(() => {
      alert(`Account created for: ${form.name} (${form.email})`);
      setSubmitted(false);
      setForm({ name: "", email: "", phone: "" });
      onClose();
    }, 300);
  };

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

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
          borderRadius: "3px",
          width: "100%",
          maxWidth: "440px",
          padding: "32px 28px",
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
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "500",
              color: "#000",
              marginBottom: "6px",
            }}
          >
            Create your account
          </h2>
          <p style={{ fontSize: "14px", color: "#999" }}>
            Sign up to start shopping
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "500",
              color: "#424242",
              marginBottom: "6px",
            }}
          >
            Full Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Ali Khan"
            className="dz-input"
            style={{ marginBottom: "16px" }}
          />

          {/* Email */}
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "500",
              color: "#424242",
              marginBottom: "6px",
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
            className="dz-input"
            style={{ marginBottom: "16px" }}
          />

          {/* Phone */}
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "500",
              color: "#424242",
              marginBottom: "6px",
            }}
          >
            Phone Number
          </label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+92 300 1234567"
            className="dz-input"
            style={{ marginBottom: "20px" }}
          />

          <button
            type="submit"
            disabled={submitted}
            className="dz-btn-primary"
            style={{ width: "100%", padding: "12px" }}
          >
            {submitted ? "Creating..." : "Create Account"}
          </button>
        </form>

        {/* Switch */}
        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "13px",
            color: "#999",
          }}
        >
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            style={{
              background: "transparent",
              border: "none",
              color: "#F85606",
              fontWeight: "500",
              fontSize: "13px",
              padding: 0,
            }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}