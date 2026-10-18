"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Eye,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail: string | null;
  notes: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "#F59E0B", icon: Clock },
  PROCESSING: { label: "Processing", color: "#3B82F6", icon: Package },
  SHIPPED: { label: "Shipped", color: "#8B5CF6", icon: Truck },
  DELIVERED: { label: "Delivered", color: "#10B981", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "#EF4444", icon: XCircle },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const admin = localStorage.getItem("ss-admin");
    if (!admin) {
      router.push("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (e) {
        console.error("Failed to fetch orders:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [ready]);

  const filtered =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!ready) {
    return <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>
          Orders
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {orders.length} total {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => {
          const isActive = filter === s;
          const count = s === "ALL" ? orders.length : orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "8px 14px",
                borderRadius: "3px",
                fontSize: "12px",
                fontWeight: "500",
                border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: isActive ? "var(--accent)" : "var(--surface)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {s === "ALL" ? "All" : statusConfig[s]?.label || s} ({count})
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="dz-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading orders...
        </div>
      ) : filtered.length === 0 ? (
        <div className="dz-card" style={{ padding: "60px 24px", textAlign: "center" }}>
          <ShoppingBag size={48} style={{ color: "var(--border-strong)", marginBottom: "12px" }} />
          <h2 style={{ fontSize: "16px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "6px" }}>
            {filter === "ALL" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {filter === "ALL"
              ? "When customers place orders, they will appear here."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((order) => {
            const cfg = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={order.id}
                className="dz-card"
                style={{ padding: "16px" }}
              >
                {/* Top row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
                        {order.orderNumber}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: `${cfg.color}15`,
                          color: cfg.color,
                          padding: "3px 8px",
                          borderRadius: "3px",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        <StatusIcon size={12} />
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>
                      Total (COD)
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--accent)" }}>
                      Rs. {order.total.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Customer */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    padding: "12px",
                    background: "var(--bg-alt)",
                    borderRadius: "3px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                      Customer
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>
                      {order.customerName}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                      Phone
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      {order.customerPhone}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                      Address
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      {order.customerAddress}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Items ({order.items.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {order.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "36px",
                            height: "36px",
                            objectFit: "cover",
                            borderRadius: "3px",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="line-clamp-1" style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            Qty: {item.quantity} × Rs. {item.price.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="dz-btn-secondary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                      fontSize: "12px",
                      padding: "8px 14px",
                    }}
                  >
                    <Eye size={14} />
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}