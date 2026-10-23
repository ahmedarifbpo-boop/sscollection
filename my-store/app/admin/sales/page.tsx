"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Package, Calendar, TrendingUp } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function AdminSalesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const admin = localStorage.getItem("ss-admin");
    if (!admin) { router.push("/admin/login"); return; }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    fetch("/api/orders")
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, [ready]);

  // Sirf Delivered Orders filter karo
  const deliveredOrders = orders.filter(o => o.status === "DELIVERED");
  
  // Total Sales
  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);

  // Product ki total quantity calculate karo (kaunsa product kitni baar bika)
  const productSales: Record<string, { qty: number; revenue: number }> = {};
  deliveredOrders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0 };
      productSales[item.name].qty += item.quantity;
      productSales[item.name].revenue += item.price * item.quantity;
    });
  });

  const bestSellers = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (!ready || loading) return <div style={{ padding: "60px", textAlign: "center" }}>Loading sales data...</div>;

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>Sales Report</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Overview of delivered orders and products sold.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="dz-card" style={{ padding: "20px", borderLeft: "4px solid #10B981" }}>
          <DollarSign size={24} style={{ color: "#10B981", marginBottom: "8px" }} />
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Revenue</div>
          <div style={{ fontSize: "24px", fontWeight: "700" }}>Rs. {totalSales.toLocaleString()}</div>
        </div>
        <div className="dz-card" style={{ padding: "20px", borderLeft: "4px solid #136CFF" }}>
          <Package size={24} style={{ color: "#136CFF", marginBottom: "8px" }} />
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Delivered Orders</div>
          <div style={{ fontSize: "24px", fontWeight: "700" }}>{deliveredOrders.length}</div>
        </div>
        <div className="dz-card" style={{ padding: "20px", borderLeft: "4px solid #F59E0B" }}>
          <TrendingUp size={24} style={{ color: "#F59E0B", marginBottom: "8px" }} />
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Products Sold</div>
          <div style={{ fontSize: "24px", fontWeight: "700" }}>{Object.keys(productSales).length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="admin-grid">
        
        {/* Best Selling Products */}
        <div className="dz-card" style={{ padding: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Best Selling Products</h2>
          {bestSellers.length === 0 ? <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No sales yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {bestSellers.map((p, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>{p.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.qty} times sold</div>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#10B981" }}>Rs. {p.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Delivered Orders */}
        <div className="dz-card" style={{ padding: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Delivered Orders History</h2>
          {deliveredOrders.length === 0 ? <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No orders delivered yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
              {deliveredOrders.map(o => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "var(--bg-alt)", borderRadius: "3px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{o.customerName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{formatDate(o.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent)" }}>Rs. {o.total.toLocaleString()}</div>
                    <div style={{ fontSize: "10px", color: "#10B981", fontWeight: "600" }}>{o.orderNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}