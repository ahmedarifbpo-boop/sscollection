
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
  Pencil,
  ShieldCheck,
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
  customerAlternativePhone: string | null;
  customerAddress: string;
  customerEmail: string | null;
  notes: string | null;
  allowOpenParcel: boolean;
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  background: "var(--surface)",
  color: "var(--text-primary)",
  fontSize: "13px",
  outline: "none",
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "6px",
};

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
  const [error, setError] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAlternativePhone: "",
    customerEmail: "",
    customerAddress: "",
  });

  const [allowOpenParcel, setAllowOpenParcel] = useState(false);

  const fillCustomerForm = (data: Order) => {
    setCustomerForm({
      customerName: data.customerName || "",
      customerPhone: data.customerPhone || "",
      customerAlternativePhone: data.customerAlternativePhone || "",
      customerEmail: data.customerEmail || "",
      customerAddress: data.customerAddress || "",
    });
    setAllowOpenParcel(Boolean(data.allowOpenParcel));
  };

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      try {
        const sessionRes = await fetch("/api/admin/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (sessionRes.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (!sessionRes.ok) {
          throw new Error("Could not verify admin session.");
        }

        const sessionData = await sessionRes.json();

        if (!sessionData.authenticated) {
          router.replace("/admin/login");
          return;
        }

        if (cancelled) return;

        setReady(true);

        if (!id) return;

        const res = await fetch(`/api/orders/${id}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (res.status === 404) {
          if (!cancelled) setOrder(null);
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch order.");
        }

        if (!cancelled) {
          setOrder(data.order);
          setNotes(data.order.notes || "");
          fillCustomerForm(data.order);
          setError("");
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);

        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch order."
          );
        }
      } finally {
        if (!cancelled) {
          setReady(true);
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [router, id]);

  const updateStatus = async (newStatus: string) => {
    if (!order || saving) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update order.");
      }

      setOrder(data.order);
      setSavedMsg(`Status updated to ${newStatus}`);

      window.setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      alert(
        "Failed to update: " +
          (err instanceof Error ? err.message : "Something went wrong.")
      );
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!order || saving) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes }),
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save remarks.");
      }

      setOrder(data.order);
      setSavedMsg("Remarks saved successfully");
      window.setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      alert(
        "Failed to save: " +
          (err instanceof Error ? err.message : "Something went wrong.")
      );
    } finally {
      setSaving(false);
    }
  };

  const saveCustomerDetails = async () => {
    if (!order || saving || order.status !== "PENDING") return;

    if (
      !customerForm.customerName.trim() ||
      !customerForm.customerPhone.trim() ||
      !customerForm.customerAddress.trim()
    ) {
      alert("Customer name, phone and address are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...customerForm,
          customerAlternativePhone:
            customerForm.customerAlternativePhone.trim() || null,
          customerEmail: customerForm.customerEmail.trim() || null,
          allowOpenParcel,
        }),
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save customer details.");
      }

      setOrder(data.order);
      fillCustomerForm(data.order);
      setEditingCustomer(false);
      setSavedMsg("Customer details saved successfully");

      window.setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save customer details."
      );
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

  const updateCustomerField = (
    field: keyof typeof customerForm,
    value: string
  ) => {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!ready || loading) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        Loading...
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <p style={{ color: "#EF4444", marginBottom: "16px" }}>{error}</p>
        <Link href="/admin/orders" className="dz-btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "20px",
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          Order not found
        </h1>
        <Link href="/admin/orders" className="dz-btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  const cfg = statuses.find((s) => s.key === order.status) || statuses[0];
  const StatusIcon = cfg.icon;
  const canEditCustomer = order.status === "PENDING";

  return (
    <div>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "6px",
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "var(--text-primary)",
              }}
            >
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

        {order.status !== "CANCELLED" &&
          order.status !== "DELIVERED" && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={saving}
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
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              <XCircle size={16} />
              Cancel Order
            </button>
          )}
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "6px",
            background: "#FEF2F2",
            color: "#B91C1C",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <div className="dz-card" style={{ padding: "20px", marginBottom: "20px" }}>
        <h2
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
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
                  border: isActive
                    ? `1px solid ${s.color}`
                    : "1px solid var(--border)",
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
          <p
            style={{
              fontSize: "12px",
              color: "#10B981",
              marginTop: "12px",
              fontWeight: "500",
            }}
          >
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
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="dz-card" style={{ padding: "20px" }}>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--text-primary)",
                marginBottom: "14px",
              }}
            >
              Order Items ({order.items.length})
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
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
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-primary)",
                        marginBottom: "3px",
                      }}
                    >
                      {item.name}
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Qty: {item.quantity} × Rs. {item.price.toLocaleString()}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "14px",
                marginTop: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                <span>Subtotal</span>
                <span>Rs. {order.subtotal.toLocaleString()}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                }}
              >
                <span>Shipping</span>
                <span>
                  {order.shipping === 0
                    ? "FREE"
                    : `Rs. ${order.shipping.toLocaleString()}`}
                </span>
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
                <span>Total ({order.paymentMethod})</span>
                <span>Rs. {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

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
              Order Remarks
            </h2>

            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "10px",
              }}
            >
              Customer confirmation call aur delivery instructions ke remarks.
            </p>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Enter order remarks..."
              className="dz-input"
              style={{
                resize: "vertical",
                marginBottom: "10px",
                width: "100%",
              }}
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
              {saving ? "Saving..." : "Save Remarks"}
            </button>
          </div>
        </div>

        <div>
          <div className="dz-card" style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "14px",
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                }}
              >
                Customer Details
              </h2>

              {canEditCustomer && !editingCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    fillCustomerForm(order);
                    setEditingCustomer(true);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    background: "var(--surface)",
                    color: "var(--accent)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={14} />
                  Edit Details
                </button>
              )}
            </div>

            {editingCustomer && canEditCustomer ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                <div>
                  <label style={fieldLabelStyle}>Customer Name *</label>
                  <input
                    style={inputStyle}
                    value={customerForm.customerName}
                    onChange={(e) =>
                      updateCustomerField("customerName", e.target.value)
                    }
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Phone Number *</label>
                  <input
                    style={inputStyle}
                    type="tel"
                    value={customerForm.customerPhone}
                    onChange={(e) =>
                      updateCustomerField("customerPhone", e.target.value)
                    }
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Alternative Phone</label>
                  <input
                    style={inputStyle}
                    type="tel"
                    value={customerForm.customerAlternativePhone}
                    onChange={(e) =>
                      updateCustomerField(
                        "customerAlternativePhone",
                        e.target.value
                      )
                    }
                    placeholder="Alternative phone (optional)"
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Email</label>
                  <input
                    style={inputStyle}
                    type="email"
                    value={customerForm.customerEmail}
                    onChange={(e) =>
                      updateCustomerField("customerEmail", e.target.value)
                    }
                    placeholder="Email address (optional)"
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Delivery Address *</label>
                  <textarea
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: "85px",
                    }}
                    value={customerForm.customerAddress}
                    onChange={(e) =>
                      updateCustomerField("customerAddress", e.target.value)
                    }
                    placeholder="Complete delivery address"
                  />
                </div>

                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "5px",
                    padding: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      marginBottom: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    <ShieldCheck size={17} />
                    Allow Customer to Open Parcel?
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setAllowOpenParcel(true)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "4px",
                        border: allowOpenParcel
                          ? "1px solid #10B981"
                          : "1px solid var(--border)",
                        background: allowOpenParcel ? "#10B98115" : "var(--surface)",
                        color: allowOpenParcel ? "#10B981" : "var(--text-secondary)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Yes
                    </button>

                    <button
                      type="button"
                      onClick={() => setAllowOpenParcel(false)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "4px",
                        border: !allowOpenParcel
                          ? "1px solid #EF4444"
                          : "1px solid var(--border)",
                        background: !allowOpenParcel ? "#EF444415" : "var(--surface)",
                        color: !allowOpenParcel ? "#EF4444" : "var(--text-secondary)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={saveCustomerDetails}
                    disabled={saving}
                    className="dz-btn-primary"
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "7px",
                      padding: "11px",
                      fontSize: "12px",
                    }}
                  >
                    <Save size={14} />
                    {saving ? "Saving..." : "Save Details"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fillCustomerForm(order);
                      setEditingCustomer(false);
                    }}
                    disabled={saving}
                    className="dz-btn-secondary"
                    style={{
                      padding: "11px 14px",
                      fontSize: "12px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <User size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <div>
                    <div style={fieldLabelStyle}>Name</div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      {order.customerName}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <Phone size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <div>
                    <div style={fieldLabelStyle}>Phone</div>
                    <a
                      href={`tel:${order.customerPhone}`}
                      style={{
                        fontSize: "13px",
                        color: "var(--accent)",
                        textDecoration: "none",
                      }}
                    >
                      {order.customerPhone}
                    </a>
                  </div>
                </div>

                {order.customerAlternativePhone && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Phone size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <div>
                      <div style={fieldLabelStyle}>Alternative Phone</div>
                      <a
                        href={`tel:${order.customerAlternativePhone}`}
                        style={{
                          fontSize: "13px",
                          color: "var(--accent)",
                          textDecoration: "none",
                        }}
                      >
                        {order.customerAlternativePhone}
                      </a>
                    </div>
                  </div>
                )}

                {order.customerEmail && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Mail size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <div>
                      <div style={fieldLabelStyle}>Email</div>
                      <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                        {order.customerEmail}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <MapPin size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <div>
                    <div style={fieldLabelStyle}>Delivery Address</div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-primary)",
                        lineHeight: "20px",
                      }}
                    >
                      {order.customerAddress}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px",
                    background: order.allowOpenParcel ? "#10B98112" : "#EF444412",
                    border: `1px solid ${order.allowOpenParcel ? "#10B98140" : "#EF444440"}`,
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                      fontWeight: 600,
                    }}
                  >
                    OPEN PARCEL PERMISSION
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: order.allowOpenParcel ? "#10B981" : "#EF4444",
                    }}
                  >
                    {order.allowOpenParcel ? "YES — Allowed" : "NO — Not Allowed"}
                  </div>
                </div>

                {!canEditCustomer && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      lineHeight: "17px",
                    }}
                  >
                    Customer details can only be edited while the order is Pending.
                  </p>
                )}

                <a
                  href={`tel:${order.customerPhone}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "4px",
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
            )}
          </div>
        </div>
      </div>

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

            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1B1B1C",
                marginBottom: "8px",
              }}
            >
              Cancel this order?
            </h3>

            <p
              style={{
                fontSize: "13px",
                color: "#666",
                lineHeight: "20px",
                marginBottom: "20px",
              }}
            >
              Order <strong>{order.orderNumber}</strong> will be marked as
              cancelled. Ye action undo nahi ho sakti.
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={saving}
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
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
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
