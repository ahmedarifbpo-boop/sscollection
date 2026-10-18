"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, MessageSquare, Tag, Settings,
  LogOut, Store, Sparkles, Bell, X
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Offers", href: "/admin/offers", icon: Sparkles },
  { label: "Live Chat", href: "/admin/chat", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  const [toast, setToast] = useState<{ title: string; msg: string; type: string } | null>(null);
  
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    
    async function checkNotifications() {
      try {
        const [ordersRes, chatRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/admin-chat")
        ]);
        const ordersData = await ordersRes.json();
        const chatData = await chatRes.json();

        const pendingOrders = (ordersData.orders || []).filter((o: any) => o.status === "PENDING").length;
        const totalChats = (chatData.conversations || []).length;
        
        const currentTotal = pendingOrders + totalChats;

        // Agar naya order ya chat aaya hai
        if (currentTotal > prevCountRef.current) {
          const diff = currentTotal - prevCountRef.current;
          
          // Bell bajaao
          setIsRinging(true);
          playRingtone();
          
          // Phone jaisi notification dikhao
          setToast({
            title: "New Notification!",
            msg: `Aapke paas ${diff} naya update aaya hai (Order ya Chat)`,
            type: "alert"
          });

          setTimeout(() => setIsRinging(false), 4000);
          setTimeout(() => setToast(null), 5000); // 5 sec baad notification gayab
        }
        
        setNotifications(currentTotal);
        prevCountRef.current = currentTotal;
      } catch (e) {
        console.error("Notification check failed");
      }
    }

    // Pehli baar check karo
    checkNotifications();
    // Har 10 sec baad check karte raho
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  // 🔔 ASLI BELL / RINGTONE KI AWAAZ
  const playRingtone = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg");
      audio.volume = 0.6; // 60% volume
      audio.play().catch((e) => console.log("Audio play blocked by browser. Click anywhere on page."));
    } catch (e) {
      console.log("Audio error");
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem("ss-admin");
    router.push("/admin/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      
      {/* 📱 PHONE Jaisi NOTIFICATION TOAST */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: "#fff", padding: "16px", borderRadius: "10px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)", borderLeft: "4px solid var(--accent)",
          display: "flex", alignItems: "flex-start", gap: "12px", width: "320px",
          animation: "slideIn 0.3s ease"
        }}>
          <div style={{ background: "var(--accent)15", padding: "8px", borderRadius: "50%", color: "var(--accent)" }}>
            <Bell size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", fontSize: "14px", color: "#1B1B1C" }}>{toast.title}</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px", lineHeight: "16px" }}>{toast.msg}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#999" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{ width: "240px", background: "#1B1B1C", color: "#fff", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 40 }}>
        
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "10px" }}>
          <Store size={22} style={{ color: "var(--accent)" }} />
          <div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>S.S Collection</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Admin Panel</div>
          </div>
        </div>

        {/* 🔔 BELL ICON */}
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "600" }}>NOTIFICATIONS</span>
          <div style={{ position: "relative" }}>
            <Bell size={20} color="#fff" style={{ animation: isRinging ? "ring 0.5s ease-in-out infinite" : "none" }} />
            {notifications > 0 && (
              <span style={{ position: "absolute", top: "-6px", right: "-8px", background: "#EF4444", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "10px" }}>
                {notifications}
              </span>
            )}
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "3px", fontSize: "13px", fontWeight: "500", color: isActive ? "#fff" : "rgba(255,255,255,0.7)", background: isActive ? "var(--accent)" : "transparent", textDecoration: "none" }}>
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "3px", fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.7)", background: "transparent", border: "none", textAlign: "left", cursor: "pointer" }}>
            <LogOut size={16} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: "240px", padding: "24px", minHeight: "100vh" }}>
        {children}
      </main>

      <style jsx>{`
        @keyframes ring {
          0% { transform: rotate(0); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          60% { transform: rotate(10deg); }
          80% { transform: rotate(-10deg); }
          100% { transform: rotate(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ padding: "24px" }}>Loading...</div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}