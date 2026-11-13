
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  User,
  UserPlus,
  HelpCircle,
  Gift,
  Coins,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useChat } from "@/lib/chat";

const LoginModal = dynamic(() => import("./LoginModal"), { ssr: false });
const SignupModal = dynamic(() => import("./SignupModal"), { ssr: false });
const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });
const ReferralModal = dynamic(() => import("./ReferralModal"), { ssr: false });
const CoinsModal = dynamic(() => import("./CoinsModal"), { ssr: false });

export default function TopBar() {
  const router = useRouter();

  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [coinsOpen, setCoinsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { totalItems } = useCart();

  // Shared Chat State
  const { isChatOpen, openChat, closeChat } = useChat();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const [customer, setCustomer] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Notification States
  const [unreadChats, setUnreadChats] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const lastAdminMsgCount = useRef(0);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.logoUrl) setLogoUrl(d.settings.logoUrl);
      });

    const savedCustomer = localStorage.getItem("ss-customer");

    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    }
  }, []);

  // Chat Notifications Logic
  useEffect(() => {
    const savedUser = localStorage.getItem("ss-chat-user");

    if (!savedUser) return;

    const user = JSON.parse(savedUser);

    const checkNewMessages = async () => {
      try {
        const res = await fetch(`/api/chat?sessionId=${user.sessionId}`);
        const data = await res.json();

        const msgs = data.messages || [];

        const adminMsgs = msgs.filter(
          (m: any) => m.sender === "admin"
        ).length;

        if (isInitialLoad.current) {
          lastAdminMsgCount.current = adminMsgs;
          isInitialLoad.current = false;
          return;
        }

        // Agar naya message aya hai
        if (adminMsgs > lastAdminMsgCount.current) {
          if (!isChatOpen) {
            setUnreadChats(adminMsgs - lastAdminMsgCount.current);
            setShowToast(true);

            // 6 second baad popup auto-hide
            setTimeout(() => setShowToast(false), 6000);
          }

          lastAdminMsgCount.current = adminMsgs;
        }
      } catch (e) {}
    };

    checkNewMessages();

    const interval = setInterval(checkNewMessages, 5000);

    return () => clearInterval(interval);
  }, [isChatOpen]);

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

  const handleOpenChat = () => {
    openChat();
    setUnreadChats(0);
    setShowToast(false);
  };

  return (
    <>
      <header
        style={{
          background: "var(--accent)",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexWrap: "nowrap",
        }}
      >
        {/* LEFT SIDE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: showSearch ? "#fff" : "transparent",
              borderRadius: "20px",
              overflow: "hidden",
              transition: "all 0.3s ease",
              flex: showSearch ? 1 : "none",
              minWidth: 0,
              marginRight: showSearch ? "8px" : "0",
            }}
          >
            <button
              onClick={() => setShowSearch(!showSearch)}
              style={{
                background: "transparent",
                border: "none",
                color: showSearch ? "var(--accent)" : "#fff",
                padding: "6px",
                display: "flex",
                cursor: "pointer",
              }}
            >
              <Search size={20} />
            </button>

            {showSearch && (
              <form
                onSubmit={handleSearch}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  style={{
                    border: "none",
                    outline: "none",
                    padding: "6px",
                    width: "100%",
                    minWidth: 0,
                    color: "#333",
                    fontSize: "14px",
                  }}
                  autoFocus
                />
              </form>
            )}
          </div>

          <button
            onClick={() => setReferralOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <Gift size={18} />
            <span className="hide-on-mobile">Referral</span>
          </button>

          <button
            onClick={() => setCoinsOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <Coins size={18} />
            <span className="hide-on-mobile">Coins</span>
          </button>
        </div>

        {/* CENTER: Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            margin: "0 4px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="S.S Collection"
                fill
                sizes="40px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "var(--accent)",
                }}
              >
                S
              </span>
            )}
          </div>
        </Link>

        {/* RIGHT SIDE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            justifyContent: "flex-end",
          }}
        >
          {customer ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 2px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#fff",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  {customer.name.charAt(0).toUpperCase()}
                </div>

                <span className="hide-on-mobile">
                  {customer.name.split(" ")[0]}
                </span>
              </button>

              {profileOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    background: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    width: "220px",
                    zIndex: 100,
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#1B1B1C",
                      }}
                    >
                      {customer.name}
                    </p>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        marginTop: "2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {customer.email}
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "transparent",
                      border: "none",
                      color: "#EF4444",
                      fontSize: "14px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
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
                  padding: "6px 2px",
                  cursor: "pointer",
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
                  padding: "6px 2px",
                  cursor: "pointer",
                }}
              >
                <UserPlus size={18} />
                <span className="hide-on-mobile">Sign Up</span>
              </button>
            </>
          )}

          {/* HELP ICON WITH BADGE */}
          <button
            onClick={handleOpenChat}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 2px",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <HelpCircle size={18} />
            <span className="hide-on-mobile">Help</span>

            {unreadChats > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-8px",
                  background: "#EF4444",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "700",
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 4px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 0 2px var(--accent)",
                  animation: "pulse 2s infinite",
                }}
              >
                {unreadChats}
              </span>
            )}
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
              padding: "6px 2px",
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

      {/* MOBILE FRIENDLY TOAST NOTIFICATION */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            top: "70px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#FFFFFF",
            border: "1px solid var(--accent)",
            borderRadius: "30px",
            padding: "8px 16px 8px 8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 10px 30px rgba(248, 86, 6, 0.25)",
            zIndex: 9999,
            animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            width: "max-content",
            maxWidth: "90vw",
          }}
        >
          <div
            style={{
              background: "var(--accent)",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <MessageSquare size={16} />
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#111",
              }}
            >
              New Message Received!
            </div>

            <div style={{ fontSize: "11px", color: "#555" }}>
              Admin has replied to your chat.
            </div>
          </div>

          <button
            onClick={handleOpenChat}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            View
          </button>
        </div>
      )}

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

      <ChatWidget isOpen={isChatOpen} onClose={closeChat} />

      <ReferralModal
        isOpen={referralOpen}
        onClose={() => setReferralOpen(false)}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenSignup={() => setSignupOpen(true)}
      />

      <CoinsModal
        isOpen={coinsOpen}
        onClose={() => setCoinsOpen(false)}
      />

      <style jsx>{`
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none;
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }

          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
          }

          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        @keyframes slideDown {
          from {
            transform: translate(-50%, -20px);
            opacity: 0;
          }

          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
