"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      alert(`Login requested for: ${email}`);
      setSubmitted(false);
      setEmail("");
      onClose();
    }, 300);
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
          borderRadius: "3px",
          width: "100%",
          maxWidth: "420px",
          padding: "32px 28px",
          position: "relative",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
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
            Welcome back
          </h2>
          <p style={{ fontSize: "14px", color: "#999" }}>
            Enter your email to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="dz-input"
            style={{ marginBottom: "20px" }}
          />

          <button
            type="submit"
            disabled={submitted}
            className="dz-btn-primary"
            style={{ width: "100%", padding: "12px" }}
          >
            {submitted ? "Please wait..." : "Login"}
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
          Don&apos;t have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            style={{
              background: "transparent",
              border: "none",
              color: "#F85606",
              fontWeight: "500",
              fontSize: "13px",
              padding: 0,
            }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}