
"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  Tag,
  Settings,
  LogOut,
  Store,
  Sparkles,
  Bell,
  X,
  Menu,
  TrendingUp,
  Users,
  Gift,
  Coins,
  Star,
  RotateCcw,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Return Requests", href: "/admin/return-requests", icon: RotateCcw },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Sales", href: "/admin/sales", icon: TrendingUp },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Offers", href: "/admin/offers", icon: Sparkles },
  { label: "Referrals", href: "/admin/referrals", icon: Gift },
  { label: "Coins", href: "/admin/coins", icon: Coins },
  { label: "Live Chat", href: "/admin/chat", icon: MessageSquare },
  { label: "Visitors", href: "/admin/visitors", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const prevCountRef = useRef(0);

  // ==========================================
  // ADMIN SESSION CHECK
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (pathname === "/admin/login") {
        setAuthChecked(true);
        return;
      }

      try {
        const res = await fetch("/api/admin/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (cancelled) return;

        // Only actual unauthorized session redirects to login.
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        // Temporary server errors should not log out the admin.
        if (!res.ok) {
          setAuthChecked(true);
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        if (!data.authenticated) {
          router.replace("/admin/login");
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error("Admin session check error:", error);

        // Network failure should not trigger automatic logout.
        if (!cancelled) {
          setAuthChecked(true);
        }
      }
    }

    setAuthChecked(false);
    checkSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // ==========================================
  // NOTIFICATIONS POLLING
  // ==========================================

  useEffect(() => {
    if (pathname === "/admin/login" || !authChecked) return;

    let cancelled = false;

    async function checkNotifications() {
      try {
        const [ordersRes, chatRes] = await Promise.all([
          fetch("/api/orders", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),

          fetch("/api/admin-chat", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        // Notification API errors must never redirect admin to login.
        if (!ordersRes.ok || !chatRes.ok) {
          return;
        }

        const ordersData = await ordersRes.json();
        const chatData = await chatRes.json();

        if (cancelled) return;

        const pendingOrders = (ordersData.orders || []).filter(
          (order: any) => order.status === "PENDING"
        ).length;

        const totalChats = (chatData.conversations || []).length;

        const currentTotal = pendingOrders + totalChats;

        if (currentTotal > prevCountRef.current) {
          const diff = currentTotal - prevCountRef.current;

          if (!cancelled) {
            setIsRinging(true);

            // Notification sound
            try {
              const audio = new Audio(
                "https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg"
              );

              audio.play().catch(() => {});
            } catch (error) {}

            // Notification toast
            setToast({
              title: "New Notification!",
              msg: `Aapke paas ${diff} naya update aaya hai`,
            });

            setTimeout(() => {
              setIsRinging(false);
            }, 4000);

            setTimeout(() => {
              setToast(null);
            }, 5000);
          }
        }

        if (!cancelled) {
          setNotifications(currentTotal);
          prevCountRef.current = currentTotal;
        }
      } catch (error) {
        // Notification errors should not log out the admin.
        console.error("Notification polling error:", error);
      }
    }

    checkNotifications();

    const interval = setInterval(checkNotifications, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname, authChecked]);

  // ==========================================
  // CLOSE MOBILE SIDEBAR ON NAVIGATION
  // ==========================================

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // ==========================================
  // LOGIN PAGE
  // ==========================================

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // ==========================================
  // SESSION LOADING
  // ==========================================

  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--text-primary)",
          fontSize: "14px",
        }}
      >
        Checking admin session...
      </div>
    );
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      setAuthChecked(false);

      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);

      setToast({
        title: "Logout Failed",
        msg: "Please try again.",
      });
    }
  };

  // ==========================================
  // ADMIN LAYOUT UI
  // ==========================================

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* NOTIFICATION TOAST */}

      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            background: "#fff",
            padding: "16px",
            borderRadius: "10px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            borderLeft: "4px solid var(--accent)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            width: "320px",
            animation: "slideIn 0.3s ease",
          }}
        >
          <div
            style={{
              background: "var(--accent)15",
              padding: "8px",
              borderRadius: "50%",
              color: "var(--accent)",
            }}
          >
            <Bell size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: "700",
                fontSize: "14px",
                color: "#1B1B1C",
              }}
            >
              {toast.title}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "4px",
              }}
            >
              {toast.msg}
            </div>
          </div>

          <button
            onClick={() => setToast(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#999",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* MOBILE HEADER */}

      <div className="mobile-header">
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <Menu size={24} />
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Store size={20} style={{ color: "var(--accent)" }} />

          <span
            style={{
              fontWeight: "700",
              fontSize: "15px",
            }}
          >
            Admin Panel
          </span>
        </div>

        <div style={{ position: "relative" }}>
          <Bell
            size={20}
            color="#fff"
            style={{
              animation: isRinging
                ? "ring 0.5s ease-in-out infinite"
                : "none",
            }}
          />

          {notifications > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                background: "#EF4444",
                color: "#fff",
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 6px",
                borderRadius: "10px",
              }}
            >
              {notifications}
            </span>
          )}
        </div>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 45,
          }}
          className="sidebar-overlay"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${isSidebarOpen ? "open" : ""}`}
        style={{
          width: "240px",
          background: "#1B1B1C",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
        }}
      >
        {/* SIDEBAR BRAND */}

        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to right, #1B1B1C, #222)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "var(--accent)",
                padding: "8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Store size={20} color="#fff" />
            </div>

            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "800",
                  color: "#fff",
                  letterSpacing: "0.5px",
                }}
              >
                S.S Collection
              </div>

              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: "600",
                }}
              >
                Admin Panel
              </div>
            </div>
          </div>

          <button
            className="close-sidebar-btn"
            onClick={() => setIsSidebarOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}

        <nav
          style={{
            flex: 1,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            overflowY: "auto",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                  background: isActive ? "var(--accent)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon
                  size={18}
                  style={{
                    opacity: isActive ? 1 : 0.7,
                  }}
                />

                <span>{item.label}</span>

                {isActive && (
                  <div
                    style={{
                      marginLeft: "auto",
                      width: "4px",
                      height: "16px",
                      background: "#fff",
                      borderRadius: "2px",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT BUTTON */}

        <div
          style={{
            padding: "20px 16px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#EF4444",
              background: "rgba(239, 68, 68, 0.1)",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main
        className="admin-main"
        style={{
          flex: 1,
          marginLeft: "240px",
          padding: "32px",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>

      {/* RESPONSIVE CSS */}

      <style jsx>{`
        @keyframes ring {
          0% {
            transform: rotate(0);
          }
          20% {
            transform: rotate(15deg);
          }
          40% {
            transform: rotate(-15deg);
          }
          60% {
            transform: rotate(10deg);
          }
          80% {
            transform: rotate(-10deg);
          }
          100% {
            transform: rotate(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .mobile-header {
          display: none;
        }

        .close-sidebar-btn {
          display: none;
        }

        .sidebar-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #1B1B1C;
            color: #fff;
            padding: 12px 16px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 40;
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }

          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            top: 0 !important;
            padding-top: 10px;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .sidebar-overlay {
            display: block !important;
          }

          .close-sidebar-btn {
            display: block;
          }

          .admin-main {
            margin-left: 0 !important;
            padding-top: 70px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// ADMIN LAYOUT EXPORT
// ==========================================

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div style={{ padding: "24px" }}>Loading...</div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
