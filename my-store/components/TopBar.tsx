"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  UserPlus,
  HelpCircle,
  Gift,
  Coins,
  LogOut,
} from "lucide-react";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import ChatWidget from "./ChatWidget";
import ReferralModal from "./ReferralModal";
import CoinsModal from "./CoinsModal";
import { useCart } from "@/lib/cart";

export default function TopBar() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [coinsOpen, setCoinsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { totalItems } = useCart();
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const [customer, setCustomer] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        if (d.settings?.logoUrl) setLogoUrl(d.settings.logoUrl);
      });

    const savedCustomer = localStorage.getItem("ss-customer");
    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setShowSearch(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("ss-customer");
    setCustomer(null);
    setProfileOpen(false);
    window.location.reload();
  };

  return (
    <>
      <header
        style={{
          background: "var(--accent)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexWrap: "wrap",
        }}
      >
        {/* LEFT SIDE: Search + Referral + Coins */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          
          <div style={{ display: "flex", alignItems: "center", background: showSearch ? "#fff" : "transparent", borderRadius: "20px", overflow: "hidden", transition: "all 0.3s ease" }}>
            <button
              onClick={() => setShowSearch(!showSearch)}
              style={{ background: "transparent", border: "none", color: showSearch ? "var(--accent)" : "#fff", padding: "8px", display: "flex", cursor: "pointer" }}
            >
              <Search size={20} />
            </button>
            
            {showSearch && (
              <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  style={{ border: "none", outline: "none", padding: "8px 12px", width: "150px", color: "#333" }}
                  autoFocus
                />
              </form>
            )}
          </div>

          <button
            onClick={() => setReferralOpen(true)}
            style={{ background: "transparent", border: "none", color: "#fff", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
          >
            <Gift size={18} />
            <span className="hide-on-mobile">Referral</span>
          </button>

          <button
            onClick={() => setCoinsOpen(true)}
            style={{ background: "transparent", border: "none", color: "#fff", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
          >
            <Coins size={18} />
            <span className="hide-on-mobile">Coins</span>
          </button>
        </div>

        {/* CENTER: Gol (Circular) Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="S.S Collection" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
            ) : (
              <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--accent)" }}>S</span>
            )}
          </div>
        </Link>

        {/* RIGHT SIDE: Login, Signup, Help, Cart ya Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, justifyContent: "flex-end" }}>
          
          {customer ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px", padding: "6px 4px", cursor: "pointer" }}
              >
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#fff", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <span className="hide-on-mobile">{customer.name.split(" ")[0]}</span>
              </button>

              {profileOpen && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "#fff", borderRadius: "8px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", width: "220px", zIndex: 100, border: "1px solid #E5E7EB" }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB" }}>
                    <p style={{ fontSize: "14px", fontWeight: "700", color: "#1B1B1C" }}>{customer.name}</p>
                    <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer.email}</p>
                  </div>
                  <button onClick={handleLogout} style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", color: "#EF4444", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", textAlign: "left" }}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => setLoginOpen(true)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px", padding: "6px 4px", cursor: "pointer" }}
              >
                <User size={18} />
                <span className="hide-on-mobile">Login</span>
              </button>

              <button
                onClick={() => setSignupOpen(true)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px", padding: "6px 4px", cursor: "pointer" }}
              >
                <UserPlus size={18} />
                <span className="hide-on-mobile">Sign Up</span>
              </button>
            </>
          )}

          <button
            onClick={() => setChatOpen(true)}
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px", padding: "6px 4px", cursor: "pointer" }}
          >
            <HelpCircle size={18} />
            <span className="hide-on-mobile">Help</span>
          </button>

          <Link
            href="/cart"
            style={{ color: "#fff", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px", padding: "6px 4px", position: "relative" }}
          >
            <ShoppingCart size={18} />
            <span className="hide-on-mobile">Cart</span>
            {totalItems > 0 && (
              <span style={{ background: "#fff", color: "var(--accent)", fontSize: "10px", fontWeight: "700", padding: "1px 5px", borderRadius: "10px", marginLeft: "2px" }}>
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSwitchToSignup={() => { setLoginOpen(false); setSignupOpen(true); }} />
      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} onSwitchToLogin={() => { setSignupOpen(false); setLoginOpen(true); }} />
      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      
      {/* 👇 Yahan ReferralModal mein naye props pass kiye hain */}
      <ReferralModal 
        isOpen={referralOpen} 
        onClose={() => setReferralOpen(false)} 
        onOpenLogin={() => setLoginOpen(true)} 
        onOpenSignup={() => setSignupOpen(true)} 
      />
      
      <CoinsModal isOpen={coinsOpen} onClose={() => setCoinsOpen(false)} />

      <style jsx>{`
        @media (max-width: 768px) {
          .hide-on-mobile { display: none; }
        }
      `}</style>
    </>
  );
}