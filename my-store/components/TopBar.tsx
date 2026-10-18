"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  UserPlus,
  HelpCircle,
} from "lucide-react";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import ChatWidget from "./ChatWidget";
import { useCart } from "@/lib/cart";

export default function TopBar() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { totalItems } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header
        style={{
          background: "var(--accent)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexWrap: "wrap", // Mobile pe wrap ho jaye
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            color: "#fff",
            fontSize: "20px",
            fontWeight: "700",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          S.S Collection
        </Link>

        {/* Search (Mobile pe full width, PC pe flexible) */}
        <form
          onSubmit={handleSearch}
          className="topbar-search-form"
          style={{ flex: "1 1 200px" }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#999",
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="dz-input"
              style={{ paddingLeft: "36px", border: "none", width: "100%" }}
            />
          </div>
        </form>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <button
            onClick={() => setLoginOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 4px",
            }}
          >
            <User size={18} />
            <span className="hide-on-mobile">Login</span>
          </button>

          <button
            onClick={() => setSignupOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 4px",
            }}
          >
            <UserPlus size={18} />
            <span className="hide-on-mobile">Sign Up</span>
          </button>

          <button
            onClick={() => setChatOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 4px",
            }}
          >
            <HelpCircle size={18} />
            <span className="hide-on-mobile">Help</span>
          </button>

          <Link
            href="/cart"
            style={{
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 4px",
              position: "relative",
            }}
          >
            <ShoppingCart size={18} />
            <span className="hide-on-mobile">Cart</span>
            {totalItems > 0 && (
              <span
                style={{
                  background: "#fff",
                  color: "var(--accent)",
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "1px 5px",
                  borderRadius: "10px",
                  marginLeft: "2px",
                }}
              >
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
      />
      <SignupModal
        isOpen={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSwitchToLogin={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
      />

      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      <style jsx>{`
        @media (max-width: 600px) {
          .hide-on-mobile {
            display: none;
          }
        }
      `}</style>
    </>
  );
}