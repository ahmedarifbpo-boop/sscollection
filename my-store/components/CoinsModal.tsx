"use client";

import { useState, useEffect } from "react";
import { X, Coins, ArrowDownCircle, ArrowUpCircle, User, Mail, Phone } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CoinsModal({ isOpen, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const savedCustomer = localStorage.getItem("ss-customer");
      if (savedCustomer) {
        const customer = JSON.parse(savedCustomer);
        // Fresh data fetch karo
        fetch(`/api/customer/check-coins?email=${encodeURIComponent(customer.email)}`)
          .then(r => r.json())
          .then(d => {
            if (d && !d.error) {
              setData(d);
              // localStorage bhi update kar do taake har jagah fresh data rahe
              const updatedCustomer = { ...customer, coins: d.totalCoins };
              localStorage.setItem("ss-customer", JSON.stringify(updatedCustomer));
            }
          })
          .catch(e => console.error(e))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.6)" }}>
      <div style={{ background: "#fff", borderRadius: "10px", width: "100%", maxWidth: "380px", padding: "20px", position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: "12px", right: "12px", background: "#F3F4F6", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#666" }}>
          <X size={16} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ background: "#FFFBEB", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: "#D97706" }}>
            <Coins size={24} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1B1B1C" }}>My Coins</h2>
          <p style={{ fontSize: "12px", color: "#666" }}>Your wallet and coin history</p>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", fontSize: "13px" }}>Loading...</p>
        ) : !data || data.error ? (
          <div style={{ textAlign: "center", padding: "16px" }}>
            <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "12px" }}>Please sign up or login to view your coins.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", padding: "16px", borderRadius: "8px", textAlign: "center", color: "#fff", boxShadow: "0 4px 10px rgba(217, 119, 6, 0.2)" }}>
              <p style={{ fontSize: "12px", opacity: 0.9, fontWeight: "500", marginBottom: "2px" }}>Available Balance</p>
              <h3 style={{ fontSize: "28px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <span style={{ fontSize: "18px" }}>Rs.</span> {data.totalCoins.toLocaleString()}
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "#F0FDF4", padding: "10px", borderRadius: "6px", border: "1px solid #DCFCE7", textAlign: "center" }}>
                <ArrowDownCircle size={18} style={{ color: "#10B981", margin: "0 auto 4px" }} />
                <p style={{ fontSize: "10px", color: "#047857", fontWeight: "600", textTransform: "uppercase" }}>Total Used</p>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "#047857", marginTop: "2px" }}>Rs. {data.totalCoinsUsed.toLocaleString()}</p>
              </div>
              <div style={{ background: "#EFF6FF", padding: "10px", borderRadius: "6px", border: "1px solid #DBEAFE", textAlign: "center" }}>
                <ArrowUpCircle size={18} style={{ color: "#3B82F6", margin: "0 auto 4px" }} />
                <p style={{ fontSize: "10px", color: "#1D4ED8", fontWeight: "600", textTransform: "uppercase" }}>Referral Code</p>
                <p style={{ fontSize: "12px", fontWeight: "700", color: "#1D4ED8", marginTop: "2px" }}>{data.referralCode}</p>
              </div>
            </div>

            <div style={{ background: "#F9FAFB", padding: "12px", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
              <h4 style={{ fontSize: "11px", fontWeight: "700", color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account Details</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#1B1B1C" }}>
                  <User size={14} style={{ color: "#9CA3AF" }} /> <strong>{data.name}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#4B5563" }}>
                  <Mail size={14} style={{ color: "#9CA3AF" }} /> {data.email}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#4B5563" }}>
                  <Phone size={14} style={{ color: "#9CA3AF" }} /> {data.phone}
                </div>
              </div>
            </div>

            <p style={{ fontSize: "10px", color: "#9CA3AF", textAlign: "center", marginTop: "4px" }}>
              You earn 3% coins on every order and Rs. 50 on every successful referral.
            </p>

          </div>
        )}
      </div>
    </div>
  );
}