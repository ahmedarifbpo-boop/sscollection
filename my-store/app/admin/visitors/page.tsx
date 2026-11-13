
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
  MapPin,
  Clock,
  Monitor,
  Globe,
  Package,
  User,
  Smartphone,
} from "lucide-react";

interface Visitor {
  id: string;
  ip: string;
  visitorId: string | null;
  sessionId: string | null;
  page: string;
  browser: string | null;
  deviceType: string | null;
  eventType: string;
  productId: string | null;
  productName: string | null;
  trafficSource: string | null;
  referrer: string | null;
  city: string | null;
  country: string | null;
  durationSeconds: number | null;
  eventData: Record<string, unknown> | null;
  createdAt: string;
}

export default function AdminVisitorsPage() {
  const router = useRouter();

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadVisitors = useCallback(async () => {
    try {
      setErrorMsg("");

      const response = await fetch("/api/admin/visitors", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load visitors");
      }

      setVisitors(data.visitors || []);
    } catch (error) {
      console.error(error);
      setErrorMsg(
        error instanceof Error ? error.message : "Failed to load visitors"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const admin = localStorage.getItem("ss-admin");

    if (!admin) {
      router.push("/admin/login");
      return;
    }

    loadVisitors();
  }, [router, loadVisitors]);

  const toggleSelect = (id: string) => {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === visitors.length) {
      setSelected([]);
    } else {
      setSelected(visitors.map((visitor) => visitor.id));
    }
  };

  const handleDelete = async () => {
    if (selected.length === 0 || deleting) return;

    if (!window.confirm(`Delete ${selected.length} selected records?`)) {
      return;
    }

    setDeleting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/admin/visitors", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selected }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete records");
      }

      setVisitors((previous) =>
        previous.filter((visitor) => !selected.includes(visitor.id))
      );

      setSelected([]);
      setSuccessMsg(`${data.deletedCount ?? selected.length} records deleted.`);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "Failed to delete records"
      );
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEvent = (event: string) => {
    const labels: Record<string, string> = {
      page_view: "Page View",
      product_view: "Product View",
      add_to_cart: "Add to Cart",
      remove_from_cart: "Remove from Cart",
      checkout_start: "Checkout Started",
      purchase: "Purchase",
      page_exit: "Page Exit",
    };

    return labels[event] || event.replaceAll("_", " ");
  };

  const eventColors = (event: string) => {
    if (event === "add_to_cart") {
      return { background: "#FEF3C7", color: "#92400E" };
    }

    if (event === "product_view") {
      return { background: "#DBEAFE", color: "#1E40AF" };
    }

    if (event === "purchase") {
      return { background: "#D1FAE5", color: "#065F46" };
    }

    if (event === "checkout_start") {
      return { background: "#EDE9FE", color: "#5B21B6" };
    }

    return { background: "var(--bg-alt)", color: "var(--text-secondary)" };
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 16px", textAlign: "center" }}>
        Loading visitors...
      </div>
    );
  }

  const allSelected =
    visitors.length > 0 && selected.length === visitors.length;

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "22px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "600",
              color: "var(--text-primary)",
            }}
          >
            Visitor Tracking
          </h1>

          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginTop: "5px",
            }}
          >
            Customer activity, devices, traffic and location
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={loadVisitors}
            className="dz-btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            onClick={handleDelete}
            disabled={selected.length === 0 || deleting}
            className="dz-btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: selected.length > 0 ? "#EF4444" : "var(--text-muted)",
              borderColor:
                selected.length > 0 ? "#EF4444" : "var(--border)",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            <Trash2 size={15} />
            {deleting ? "Deleting..." : `Delete (${selected.length})`}
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      {errorMsg && (
        <div
          style={{
            background: "#FEE2E2",
            color: "#B91C1C",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "14px",
            fontSize: "13px",
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: "#D1FAE5",
            color: "#065F46",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "14px",
            fontSize: "13px",
          }}
        >
          {successMsg}
        </div>
      )}

      {/* SELECT ALL */}
      <div
        className="dz-card"
        style={{
          padding: "12px 14px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={toggleAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            background: "transparent",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {allSelected ? (
            <CheckSquare size={18} />
          ) : (
            <Square size={18} />
          )}
          Select all
        </button>

        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {visitors.length} recent records
        </span>
      </div>

      {/* VISITOR CARDS */}
      {visitors.length === 0 ? (
        <div
          className="dz-card"
          style={{
            padding: "40px 16px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "14px",
          }}
        >
          No visitors tracked yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            gap: "14px",
          }}
        >
          {visitors.map((visitor) => {
            const colors = eventColors(visitor.eventType);

            return (
              <div
                key={visitor.id}
                className="dz-card"
                style={{
                  padding: "15px",
                  minWidth: 0,
                  border:
                    selected.includes(visitor.id)
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                }}
              >
                {/* CARD TOP */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "13px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 9px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: colors.background,
                        color: colors.color,
                        textTransform: "capitalize",
                      }}
                    >
                      {formatEvent(visitor.eventType)}
                    </span>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginTop: "8px",
                      }}
                    >
                      {formatDate(visitor.createdAt)}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSelect(visitor.id)}
                    aria-label="Select visitor record"
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: selected.includes(visitor.id)
                        ? "var(--accent)"
                        : "var(--text-muted)",
                      padding: "2px",
                    }}
                  >
                    {selected.includes(visitor.id) ? (
                      <CheckSquare size={20} />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>
                </div>

                {/* PRODUCT NAME */}
                {visitor.productName && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      padding: "10px",
                      background: "var(--bg-alt)",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <Package
                      size={16}
                      style={{
                        color: "var(--accent)",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          marginBottom: "3px",
                        }}
                      >
                        PRODUCT
                      </div>

                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "var(--text-primary)",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {visitor.productName}
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE */}
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    PAGE
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {visitor.page}
                  </div>
                </div>

                {/* DEVICE AND LOCATION */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "13px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "5px",
                      }}
                    >
                      {visitor.deviceType === "Desktop" ? (
                        <Monitor size={13} />
                      ) : (
                        <Smartphone size={13} />
                      )}
                      Device
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-primary)",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {visitor.deviceType || "Unknown"}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginTop: "3px",
                      }}
                    >
                      {visitor.browser || "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "5px",
                      }}
                    >
                      <MapPin size={13} />
                      Location
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-primary)",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {[visitor.city, visitor.country]
                        .filter(Boolean)
                        .join(", ") || "Unknown"}
                    </div>
                  </div>
                </div>

                {/* SOURCE AND DURATION */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    padding: "11px 0",
                    borderTop: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "5px",
                      }}
                    >
                      <Globe size={13} />
                      Traffic Source
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-primary)",
                        textTransform: "capitalize",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {visitor.trafficSource || "Direct"}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "5px",
                      }}
                    >
                      <Clock size={13} />
                      Page Duration
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {visitor.durationSeconds == null
                        ? "Not recorded"
                        : `${visitor.durationSeconds} sec`}
                    </div>
                  </div>
                </div>

                {/* VISITOR AND SESSION */}
                <div style={{ paddingTop: "11px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    <User size={13} />
                    Visitor ID
                  </div>

                  <div
                    title={visitor.visitorId || ""}
                    style={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {visitor.visitorId || "Not available"}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginTop: "8px",
                    }}
                  >
                    Session: {visitor.sessionId || "Not available"}
                  </div>
                </div>

                {/* REFERRER */}
                {visitor.referrer && (
                  <div
                    style={{
                      marginTop: "10px",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                      }}
                    >
                      REFERRER
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {visitor.referrer}
                    </div>
                  </div>
                )}

                {/* IP */}
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "12px",
                  }}
                >
                  IP: {visitor.ip}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
