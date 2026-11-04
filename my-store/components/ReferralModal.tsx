"use client";

import { useState, useEffect } from "react";
import { X, Copy, Gift, CheckCircle2, Ticket, AlertCircle, LogIn, UserPlus, TrendingUp } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export default function ReferralModal({ isOpen, onClose, onOpenLogin, onOpenSignup }: Props) {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Apply Code States
  const [applyCode, setApplyCode] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedCustomer = localStorage.getItem("ss-customer");
      if (savedCustomer) {
        const customerData = JSON.parse(savedCustomer);
        
        // 🟢 Fresh data fetch karo (taake totalReferrals aur coins foran update hon)
        fetch(`/api/customer/check-coins?email=${encodeURIComponent(customerData.email)}&t=${Date.now()}`, { cache: "no-store" })
          .then(r => r.json())
          .then(d => {
            if (d && !d.error) {
              setCustomer({
                ...customerData,
                coins: d.totalCoins,
                referralCoins: d.referralCoins,
                totalReferrals: d.totalReferrals, // 👈 API se fresh totalReferrals set hoga
              });
            } else {
              setCustomer(customerData);
            }
          })
          .catch(() => setCustomer(customerData));
      }
      setLoading(false);
    }
  }, [isOpen]);

  const copyCode = () => {
    if (!customer) return;
    navigator.clipboard.writeText(customer.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCode = async () => {
    setApplyError("");
    setApplySuccess(false);

    if (!applyCode.trim()) return;

    try {
      const res = await fetch("/api/customer/apply-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customer.email, referralCode: applyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedCustomer = { ...customer, referredBy: applyCode.trim().toUpperCase() };
      localStorage.setItem("ss-customer", JSON.stringify(updatedCustomer));
      setCustomer(updatedCustomer);
      setApplySuccess(true);
      setApplyCode("");
    } catch (err: any) {
      setApplyError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.6)" }}>
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "420px", padding: "24px", position: "relative", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "#F3F4F6", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#666" }}>
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Gift size={48} style={{ color: "var(--accent)", margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1B1B1C" }}>Refer & Earn</h2>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>Get Rs. 50 coins for every successful referral!</p>
        </div>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : !customer ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
              Please login or create an account to get your unique referral code and start earning coins.
            </p>
            
            <button 
              onClick={() => { onClose(); onOpenLogin(); }}
              className="dz-btn-primary" 
              style={{ width: "100%", padding: "14px", fontSize: "16px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <LogIn size={18} /> Login to Continue
            </button>

            <button 
              onClick={() => { onClose(); onOpenSignup(); }}
              className="dz-btn-secondary" 
              style={{ width: "100%", padding: "14px", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <UserPlus size={18} /> Create New Account
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px", border: "1px solid #E5E7EB", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600", textTransform: "uppercase" }}>Total Referrals</p>
                <p style={{ fontSize: "24px", fontWeight: "800", color: "#1B1B1C", marginTop: "4px" }}>{customer.totalReferrals || 0}</p>
              </div>
              <div style={{ background: "#FFFBEB", padding: "16px", borderRadius: "8px", border: "1px solid #FDE68A", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "#B45309", fontWeight: "600", textTransform: "uppercase" }}>Total Coins</p>
                <p style={{ fontSize: "24px", fontWeight: "800", color: "#D97706", marginTop: "4px" }}>Rs. {customer.coins || 0}</p>
              </div>
            </div>

            {/* NAYA: Referral Coins Earned */}
            <div style={{ background: "#EFF6FF", padding: "16px", borderRadius: "8px", border: "1px solid #DBEAFE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1D4ED8", fontWeight: "600" }}>
                <TrendingUp size={20} />
                <span style={{ fontSize: "14px" }}>Referral Coins Earned</span>
              </div>
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#3B82F6" }}>
                Rs. {customer.referralCoins || 0}
              </span>
            </div>

            {/* Referral Code */}
            <div style={{ background: "#F0FDF4", padding: "20px", borderRadius: "8px", border: "1px dashed #10B981", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#047857", fontWeight: "600", marginBottom: "8px" }}>Your Unique Referral Code</p>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#10B981", letterSpacing: "2px", marginBottom: "12px" }}>{customer.referralCode}</div>
              <button onClick={copyCode} style={{ background: "#10B981", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "4px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                {copied ? <><CheckCircle2 size={16} /> Copied!</> : <><Copy size={16} /> Copy Code</>}
              </button>
            </div>

            {/* Apply Code */}
            <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Ticket size={16} /> Enter a Friend's Referral Code
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  placeholder="e.g. SS-ABCDE" 
                  value={applyCode}
                  onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                  className="dz-input" 
                  style={{ flex: 1 }} 
                  disabled={!!customer.referredBy}
                />
                <button 
                  onClick={handleApplyCode} 
                  className="dz-btn-primary" 
                  style={{ padding: "0 16px" }}
                  disabled={!!customer.referredBy}
                >
                  Apply
                </button>
              </div>
              {customer.referredBy ? (
                <p style={{ fontSize: "12px", color: "#10B981", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={14} /> You are referred by: {customer.referredBy}
                </p>
              ) : applySuccess ? (
                <p style={{ fontSize: "12px", color: "#10B981", marginTop: "8px" }}>Code applied successfully!</p>
              ) : (
                <p style={{ fontSize: "11px", color: "#6B7280", marginTop: "8px" }}>Apply a code before your first order.</p>
              )}
              {applyError && <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={14} /> {applyError}</p>}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}