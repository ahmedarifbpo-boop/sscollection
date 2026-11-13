
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
  Coins,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Customer {
  referralCode: string;
  referredBy: string | null;
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
  coinsUsed: number;
  coinsEarned: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
  customer: Customer | null;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  PENDING: {
    label: "Pending",
    color: "#F59E0B",
    icon: Clock,
  },
  PROCESSING: {
    label: "Processing",
    color: "#3B82F6",
    icon: Package,
  },
  SHIPPED: {
    label: "Shipped",
    color: "#8B5CF6",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    color: "#10B981",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#EF4444",
    icon: XCircle,
  },
};

export default function AdminOrdersPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  // Admin session check + Orders fetch
  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        // Step 1: Verify admin session
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

        // Step 2: Fetch orders
        const res = await fetch("/api/orders", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch orders.");
        }

        if (!cancelled) {
          setOrders(data.orders || []);
          setError("");
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch orders."
          );
        }
      } finally {
        if (!cancelled) {
          setReady(true);
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Filter orders
  const filtered =
    filter === "ALL"
      ? orders
      : orders.filter((order) => order.status === filter);

  // Format date
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

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "500",
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          Orders
        </h1>

        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {orders.length} total{" "}
          {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {/* Error Message */}
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

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {[
          "ALL",
          "PENDING",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ].map((s) => {
          const isActive = filter === s;

          const count =
            s === "ALL"
              ? orders.length
              : orders.filter((o) => o.status === s).length;

          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "8px 14px",
                borderRadius: "3px",
                fontSize: "12px",
                fontWeight: "500",
                border: isActive
                  ? "1px solid var(--accent)"
                  : "1px solid var(--border)",
                background: isActive
                  ? "var(--accent)"
                  : "var(--surface)",
                color: isActive
                  ? "#fff"
                  : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {s === "ALL"
                ? "All"
                : statusConfig[s]?.label || s}{" "}
              ({count})
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div
          className="dz-card"
          style={{
            padding: "60px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Loading orders...
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="dz-card"
          style={{
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <ShoppingBag
            size={48}
            style={{
              color: "var(--border-strong)",
              marginBottom: "12px",
            }}
          />

          <h2
            style={{
              fontSize: "16px",
              fontWeight: "500",
              color: "var(--text-primary)",
              marginBottom: "6px",
            }}
          >
            {filter === "ALL"
              ? "No orders yet"
              : `No ${filter.toLowerCase()} orders`}
          </h2>

          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            {filter === "ALL"
              ? "When customers place orders, they will appear here."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {filtered.map((order) => {
            const cfg =
              statusConfig[order.status] || statusConfig.PENDING;

            const StatusIcon = cfg.icon;

            // Check if coins are involved
            const hasCoins =
              order.coinsUsed > 0 ||
              order.coinsEarned > 0 ||
              !!order.customer?.referredBy;

            return (
              <div
                key={order.id}
                className="dz-card"
                style={{ padding: "16px" }}
              >
                {/* Top Row */}
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                        }}
                      >
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

                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  {/* Total and Coins */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "2px",
                      }}
                    >
                      Total (COD)
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "var(--accent)",
                        marginBottom: "4px",
                      }}
                    >
                      Rs. {order.total.toLocaleString()}
                    </div>

                    {/* Coins Badge */}
                    {hasCoins && (
                      <div
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "2px",
                          background: "#FFFBEB",
                          padding: "4px 8px",
                          borderRadius: "3px",
                          fontSize: "11px",
                          color: "#B45309",
                          border: "1px solid #FDE68A",
                        }}
                      >
                        {order.coinsUsed > 0 && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Coins size={10} />
                            Used: Rs.{" "}
                            {order.coinsUsed.toLocaleString()}
                          </span>
                        )}

                        {order.coinsEarned > 0 && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Coins size={10} />
                            Earned: Rs.{" "}
                            {order.coinsEarned.toFixed(0)}
                          </span>
                        )}

                        {order.customer?.referredBy && (
                          <span style={{ fontWeight: "600" }}>
                            Ref: {order.customer.referredBy}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Details */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    padding: "12px",
                    background: "var(--bg-alt)",
                    borderRadius: "3px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "2px",
                      }}
                    >
                      Customer
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "var(--text-primary)",
                      }}
                    >
                      {order.customerName}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "2px",
                      }}
                    >
                      Phone
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {order.customerPhone}
                    </div>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "2px",
                      }}
                    >
                      Address
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {order.customerAddress}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Items ({order.items.length})
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
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

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            className="line-clamp-1"
                            style={{
                              fontSize: "12px",
                              color: "var(--text-primary)",
                            }}
                          >
                            {item.name}
                          </div>

                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            Qty: {item.quantity} × Rs.{" "}
                            {item.price.toLocaleString()}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Rs.{" "}
                          {(
                            item.price * item.quantity
                          ).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border)",
                  }}
                >
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
