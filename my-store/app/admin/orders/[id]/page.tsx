"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  User,
  Mail,
  StickyNote,
  Save,
  AlertTriangle,
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

const statuses = [
  { key: "PENDING", label: "Pending", color: "#F59E0B", icon: Clock },
  { key: "PROCESSING", label: "Processing", color: "#3B82F6", icon: Package },
  { key: "SHIPPED", label: "Shipped", color: "#8B5CF6", icon: Truck },
  { key: "DELIVERED", label: "Delivered", color: "#10B981", icon: CheckCircle2 },
  { key: "CANCELLED", label: "Cancelled", color: "#EF4444", icon: XCircle },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
    if (!ready || !id) return;
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.status === 404) {
          setOrder(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setOrder(data.order);
        setNotes(data.order.notes || "");
      } catch (e) {
        console.error("Failed to fetch order:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [ready, id]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(data.order);
      setSavedMsg(`Status updated to ${newStatus}`);
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e: any) {
      alert("Failed to update: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(data.order);
      setSavedMsg("Notes saved");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    await updateStatus("CANCELLED");
    setShowCancelConfirm(false);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-PK", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!ready || loading) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "20px", color: "var(--text-primary)", marginBottom: "12px" }}>
          Order not found
        </h1>
        <Link href="/admin/orders" className="dz-btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const cfg = statuses.find((s) => s.key === order.status) || statuses[0];
  const StatusIcon = cfg.icon;

  return (
    <div>
      {/* Back */}
      <Link
        href="/admin/orders"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--text-secondary)",
          fontSize: "13px",
          marginBottom: "20px",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={16} />
        Back to Orders
      </Link>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)" }}>
              {order.orderNumber}
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: `${cfg.color}15`,
                color: cfg.color,
                padding: "4px 10px",
                borderRadius: "3px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              <StatusIcon size={14} />
              {cfg.label}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Cancel button — agar already cancelled nahi hai */}
        {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "3px",
              background: "#FEE",
              color: "#EF4444",
              border: "1px solid #EF4444",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            <XCircle size={16} />
            Cancel Order
          </button>
        )}
      </div>

      {/* Status update */}
      <div className="dz-card" style={{ padding: "20px", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "12px" }}>
          Update Order Status
        </h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {statuses.map((s) => {
            const Icon = s.icon;
            const isActive = order.status === s.key;
            return (
              <button
                key={s.key}
                onClick={() => updateStatus(s.key)}
                disabled={saving || isActive}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "3px",
                  fontSize: "12px",
                  fontWeight: "500",
                  border: isActive ? `1px solid ${s.color}` : "1px solid var(--border)",
                  background: isActive ? `${s.color}15` : "var(--surface)",
                  color: isActive ? s.color : "var(--text-secondary)",
                  cursor: isActive ? "default" : "pointer",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}
        </div>
        {savedMsg && (
          <p style={{ fontSize: "12px", color: "#10B981", marginTop: "12px", fontWeight: "500" }}>
            ✓ {savedMsg}
          </p>
        )}
      </div>

      <div
        className="order-detail-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "20px",
        }}
      >
        {/* LEFT — Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Items */}
          <div className="dz-card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "14px" }}>
              Order Items ({order.items.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {order.items.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: "56px",
                      height: "56px",
                      objectFit: "cover",
                      borderRadius: "3px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "3px" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Qty: {item.quantity} × Rs. {item.price.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                <span>Subtotal</span>
                <span>Rs. {order.subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                <span>Shipping</span>
                <span>{order.shipping === 0 ? "FREE" : `Rs. ${order.shipping}`}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "var(--accent)",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span>Total (COD)</span>
                <span>Rs. {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="dz-card" style={{ padding: "20px" }}>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--text-primary)",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <StickyNote size={16} />
              Internal Notes
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this order (dispute reason, customer feedback, etc.)"
              className="dz-input"
              style={{ resize: "none", marginBottom: "10px" }}
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="dz-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                fontSize: "12px",
              }}
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </div>

        {/* RIGHT — Customer */}
        <div>
          <div className="dz-card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "14px" }}>
              Customer Details
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <User size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                    Name
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>
                    {order.customerName}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Phone size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                    Phone
                  </div>
                  <a
                    href={`tel:${order.customerPhone}`}
                    style={{ fontSize: "13px", fontWeight: "500", color: "var(--accent)", textDecoration: "none" }}
                  >
                    {order.customerPhone}
                  </a>
                </div>
              </div>

              {order.customerEmail && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <Mail size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                      Email
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      {order.customerEmail}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <MapPin size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                    Delivery Address
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "20px" }}>
                    {order.customerAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* Call button */}
            <a
              href={`tel:${order.customerPhone}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "16px",
                padding: "12px",
                background: "var(--accent)",
                color: "#fff",
                borderRadius: "3px",
                fontSize: "13px",
                fontWeight: "500",
                textDecoration: "none",
              }}
            >
              <Phone size={16} />
              Call Customer
            </a>
          </div>
        </div>
      </div>

      {/* Cancel confirmation popup */}
      {showCancelConfirm && (
        <div
          className="fade-in"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="modal-in"
            style={{
              background: "#fff",
              borderRadius: "3px",
              padding: "28px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#FEE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <AlertTriangle size={28} style={{ color: "#EF4444" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1B1B1C", marginBottom: "8px" }}>
              Cancel this order?
            </h3>
            <p style={{ fontSize: "13px", color: "#666", lineHeight: "20px", marginBottom: "20px" }}>
              Order <strong>{order.orderNumber}</strong> will be marked as cancelled. Ye action undo nahi ho sakti.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowCancelConfirm(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#F5F5F5",
                  color: "#424242",
                  border: "none",
                  borderRadius: "3px",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                No, keep it
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#EF4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "3px",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                {saving ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 900px) {
          .order-detail-grid {
            grid-template-columns: 2fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}