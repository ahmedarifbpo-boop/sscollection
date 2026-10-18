"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, ShoppingBag, Users, DollarSign, Package, Clock,
  CheckCircle2, XCircle, ArrowRight, Flame, Phone, Database, Trash2, Calendar
} from "lucide-react";

interface OrderItem { id: string; name: string; price: number; quantity: number; image: string; }
interface Order {
  id: string; orderNumber: string; customerName: string; customerPhone: string;
  customerAddress: string; total: number; status: string; createdAt: string; items: OrderItem[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storageSize, setStorageSize] = useState("...");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const admin = localStorage.getItem("ss-admin");
    if (!admin) { router.push("/admin/login"); return; }
    setReady(true);
  }, [router]);

  const fetchData = async () => {
    try {
      const [ordersRes, storageRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/storage")
      ]);
      const ordersData = await ordersRes.json();
      const storageData = await storageRes.json();
      
      setOrders(ordersData.orders || []);
      setStorageSize(storageData.size || "0 MB");
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    fetchData();
  }, [ready]);

  const handleClearData = async () => {
    if (!window.confirm("Kya aap waqai saari orders aur chats delete karna chahte hain? Ye test data clear ho jayega.")) return;
    setClearing(true);
    try {
      const res = await fetch("/api/clear-orders", { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchData(); // refresh
      alert("Data cleared successfully!");
    } catch (e) {
      alert("Failed to clear data.");
    } finally {
      setClearing(false);
    }
  };

  // === CALCULATIONS ===
  const validOrders = orders.filter((o) => o.status !== "CANCELLED");
  const totalSales = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = validOrders.length > 0 ? totalSales / validOrders.length : 0;
  const uniqueCustomers = new Set(orders.map((o) => o.customerPhone)).size;

  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;

  // === DAILY & HISTORY CALCULATIONS ===
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  const dayBefore = new Date(now);
  dayBefore.setDate(dayBefore.getDate() - 2);
  const dayBeforeStr = dayBefore.toISOString().split("T")[0];

  const calculateDayStats = (dateStr: string) => {
    const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr));
    const dayValidOrders = dayOrders.filter(o => o.status !== "CANCELLED");
    const daySales = dayValidOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      orders: dayOrders.length,
      sales: daySales,
      cancelled: dayOrders.filter(o => o.status === "CANCELLED").length
    };
  };

  const todayStats = calculateDayStats(todayStr);
  const yesterdayStats = calculateDayStats(yesterdayStr);
  const dayBeforeStats = calculateDayStats(dayBeforeStr);

  const stats = [
    { label: "Total Sales", value: `Rs. ${totalSales.toLocaleString()}`, icon: DollarSign, color: "#F85606" },
    { label: "Total Orders", value: totalOrders.toString(), icon: ShoppingBag, color: "#136CFF" },
    { label: "Customers", value: uniqueCustomers.toString(), icon: Users, color: "#009DB4" },
    { label: "Avg. Order Value", value: `Rs. ${Math.round(avgOrderValue).toLocaleString()}`, icon: TrendingUp, color: "#2ECC71" },
  ];

  const formatDate = (iso: string) => new Date(iso).toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (!ready || loading) return <div style={{ padding: "60px", textAlign: "center" }}>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>Dashboard</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Store ka poora overview yahan hai.</p>
        </div>
        
        {/* CLEAR DATA BUTTON */}
        {totalOrders > 0 && (
          <button onClick={handleClearData} disabled={clearing} className="dz-btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#EF4444", borderColor: "#EF4444" }}>
            <Trash2 size={16} /> {clearing ? "Clearing..." : "Clear Test Data"}
          </button>
        )}
      </div>

      {/* Storage Card */}
      <div className="dz-card" style={{ padding: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "4px solid #F59E0B" }}>
        <div style={{ background: "#F59E0B15", padding: "12px", borderRadius: "50%", color: "#F59E0B" }}><Database size={24} /></div>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Database Storage Used</div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>{storageSize}</div>
        </div>
      </div>

      {/* Main Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="dz-card" style={{ padding: "20px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "3px", background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color, marginBottom: "12px" }}><Icon size={20} /></div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{stat.label}</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)" }}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Daily History Section */}
      <div className="dz-card" style={{ padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Calendar size={18} style={{ color: "var(--accent)" }} />
          <h2 style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)" }}>Daily Sales History</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          
          {/* Today */}
          <div style={{ background: "var(--bg-alt)", padding: "16px", borderRadius: "3px" }}>
            <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>Aaj (Today)</div>
            <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>Rs. {todayStats.sales.toLocaleString()}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{todayStats.orders} Orders · {todayStats.cancelled} Cancelled</div>
          </div>

          {/* Yesterday */}
          <div style={{ background: "var(--bg-alt)", padding: "16px", borderRadius: "3px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>Kal (Yesterday)</div>
            <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>Rs. {yesterdayStats.sales.toLocaleString()}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{yesterdayStats.orders} Orders · {yesterdayStats.cancelled} Cancelled</div>
          </div>

          {/* Day Before */}
          <div style={{ background: "var(--bg-alt)", padding: "16px", borderRadius: "3px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>Parson (Day Before)</div>
            <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>Rs. {dayBeforeStats.sales.toLocaleString()}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{dayBeforeStats.orders} Orders · {dayBeforeStats.cancelled} Cancelled</div>
          </div>

        </div>
      </div>

      {/* Orders Summary (Pending, Delivered, Cancelled) */}
      <div className="dz-card" style={{ padding: "20px", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "16px" }}>Order Status Summary (All Time)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
          <div style={{ background: "#F59E0B10", padding: "16px", borderRadius: "3px", textAlign: "center" }}>
            <Clock size={24} style={{ color: "#F59E0B", marginBottom: "8px" }} /><div style={{ fontSize: "20px", fontWeight: "700", color: "#F59E0B" }}>{pendingOrders}</div><div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Pending</div>
          </div>
          <div style={{ background: "#10B98110", padding: "16px", borderRadius: "3px", textAlign: "center" }}>
            <CheckCircle2 size={24} style={{ color: "#10B981", marginBottom: "8px" }} /><div style={{ fontSize: "20px", fontWeight: "700", color: "#10B981" }}>{deliveredOrders}</div><div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Delivered</div>
          </div>
          <div style={{ background: "#EF444410", padding: "16px", borderRadius: "3px", textAlign: "center" }}>
            <XCircle size={24} style={{ color: "#EF4444", marginBottom: "8px" }} /><div style={{ fontSize: "20px", fontWeight: "700", color: "#EF4444" }}>{cancelledOrders}</div><div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Cancelled</div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="dz-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)" }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: "500" }}>View all <ArrowRight size={14} /></Link>
        </div>
        {orders.length === 0 ? <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No orders yet.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {orders.slice(0, 5).map((order) => {
              const isCancelled = order.status === "CANCELLED";
              return (
                <Link key={order.id} href={`/admin/orders/${order.id}`} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "3px", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "3px", background: isCancelled ? "#EF444415" : "#10B98115", display: "flex", alignItems: "center", justifyContent: "center", color: isCancelled ? "#EF4444" : "#10B981", flexShrink: 0 }}>
                    {isCancelled ? <XCircle size={20} /> : <Package size={20} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "2px" }}>{order.customerName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{order.orderNumber} · {formatDate(order.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "2px" }}>Rs. {order.total.toLocaleString()}</div>
                    <div style={{ fontSize: "10px", color: isCancelled ? "#EF4444" : "#10B981", fontWeight: "700", textTransform: "uppercase" }}>{order.status}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}