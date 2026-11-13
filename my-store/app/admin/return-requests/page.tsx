
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  RefreshCw,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Video,
  FileText,
  ExternalLink,
} from "lucide-react";

type OrderItem = {
  id: string;
  productName?: string;
  name?: string;
  quantity: number;
  price: number;
  image?: string | null;
};

type Order = {
  id: string;
  orderNumber?: string | null;
  name?: string | null;
  customerName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  status?: string | null;
  total?: number;
  totalAmount?: number;
  createdAt?: string;
  items: OrderItem[];
};

type ReturnRequest = {
  id: string;
  orderId: string;
  reason: string;
  details?: string | null;
  images: string[];
  videos: string[];
  status: string;
  createdAt: string;
  order: Order;
};

export default function ReturnRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    try {
      setError("");

      const response = await fetch("/api/admin/return-requests", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Return requests load nahi ho sakin.");
      }

      const data = await response.json();
      setRequests(data.returnRequests || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const money = (amount?: number) => {
    return `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;
  };

  const getCustomerName = (order: Order) =>
    order.customerName || order.name || "Customer";

  const getOrderNumber = (order: Order) =>
    order.orderNumber || order.id;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <RotateCcw size={25} />
            Return Requests
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
              marginTop: "7px",
            }}
          >
            Customer return requests and uploaded media
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetchRequests();
          }}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text-primary)",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          <RefreshCw
            size={16}
            style={{
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
          Refresh
        </button>
      </div>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#EF4444",
              padding: "12px",
              borderRadius: "10px",
            }}
          >
            <RotateCcw size={23} />
          </div>

          <div>
            <div
              style={{
                fontSize: "25px",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {requests.length}
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              Total Return Requests
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "16px",
            background: "rgba(239,68,68,0.1)",
            color: "#DC2626",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          Loading return requests...
        </div>
      ) : requests.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
          }}
        >
          <Package
            size={42}
            style={{
              color: "var(--text-secondary)",
              marginBottom: "12px",
            }}
          />

          <h3
            style={{
              color: "var(--text-primary)",
              fontSize: "17px",
              margin: "0 0 8px",
            }}
          >
            No Return Requests
          </h3>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "13px",
              margin: 0,
            }}
          >
            Customer return requests yahan show hongi.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {requests.map((request, index) => {
            const order = request.order;

            return (
              <div
                key={request.id}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: 800,
                        fontSize: "16px",
                      }}
                    >
                      Return Request #{requests.length - index}
                    </div>

                    <div
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                        marginTop: "5px",
                      }}
                    >
                      <Calendar
                        size={13}
                        style={{
                          display: "inline",
                          verticalAlign: "middle",
                          marginRight: "5px",
                        }}
                      />
                      {formatDate(request.createdAt)}
                    </div>
                  </div>

                  <span
                    style={{
                      background: "rgba(245,158,11,0.12)",
                      color: "#D97706",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 800,
                    }}
                  >
                    {request.status || "NEW"}
                  </span>
                </div>

                <div
                  style={{
                    padding: "20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "24px",
                  }}
                >
                  <section>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        margin: "0 0 15px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <User size={17} />
                      Customer Details
                    </h3>

                    <div style={{ display: "grid", gap: "12px" }}>
                      <InfoRow
                        icon={<User size={15} />}
                        label="Name"
                        value={getCustomerName(order)}
                      />

                      <InfoRow
                        icon={<Phone size={15} />}
                        label="Phone"
                        value={order.phone || "Not available"}
                      />

                      <InfoRow
                        icon={<Mail size={15} />}
                        label="Email"
                        value={order.email || "Not available"}
                      />

                      <InfoRow
                        icon={<MapPin size={15} />}
                        label="Address"
                        value={
                          [order.address, order.city]
                            .filter(Boolean)
                            .join(", ") || "Not available"
                        }
                      />
                    </div>
                  </section>

                  <section>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        margin: "0 0 15px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Package size={17} />
                      Order Details
                    </h3>

                    <div style={{ display: "grid", gap: "12px" }}>
                      <InfoRow
                        label="Order ID"
                        value={getOrderNumber(order)}
                      />

                      <InfoRow
                        label="Order Status"
                        value={order.status || "Not available"}
                      />

                      <InfoRow
                        label="Order Total"
                        value={money(order.total ?? order.totalAmount)}
                      />

                      <InfoRow
                        label="Order Date"
                        value={
                          order.createdAt
                            ? formatDate(order.createdAt)
                            : "Not available"
                        }
                      />
                    </div>
                  </section>
                </div>

                <div
                  style={{
                    margin: "0 20px",
                    borderTop: "1px solid var(--border)",
                    padding: "20px 0",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      margin: "0 0 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Package size={17} />
                    Ordered Products
                  </h3>

                  {order.items?.length ? (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "10px",
                            padding: "12px",
                            background: "var(--bg)",
                            borderRadius: "8px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "var(--text-primary)",
                                fontSize: "13px",
                                fontWeight: 700,
                              }}
                            >
                              {item.productName || item.name || "Product"}
                            </div>

                            <div
                              style={{
                                color: "var(--text-secondary)",
                                fontSize: "12px",
                                marginTop: "4px",
                              }}
                            >
                              Quantity: {item.quantity}
                            </div>
                          </div>

                          <div
                            style={{
                              color: "var(--text-primary)",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            {money(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      No product details available.
                    </p>
                  )}
                </div>

                <div
                  style={{
                    margin: "0 20px",
                    borderTop: "1px solid var(--border)",
                    padding: "20px 0",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      margin: "0 0 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileText size={17} />
                    Return Reason
                  </h3>

                  <div
                    style={{
                      padding: "14px",
                      background: "var(--bg)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-primary)",
                        fontWeight: 700,
                      }}
                    >
                      {request.reason}
                    </div>

                    {request.details && (
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "13px",
                          lineHeight: 1.6,
                          margin: "9px 0 0",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {request.details}
                      </p>
                    )}
                  </div>
                </div>

                {(request.images?.length > 0 ||
                  request.videos?.length > 0) && (
                  <div
                    style={{
                      margin: "0 20px",
                      borderTop: "1px solid var(--border)",
                      padding: "20px 0",
                    }}
                  >
                    {request.images?.length > 0 && (
                      <div style={{ marginBottom: "22px" }}>
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            margin: "0 0 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <ImageIcon size={17} />
                          Uploaded Images ({request.images.length})
                        </h3>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(130px, 160px))",
                            gap: "12px",
                          }}
                        >
                          {request.images.map((url, imageIndex) => (
                            <a
                              key={`${url}-${imageIndex}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "block",
                                textDecoration: "none",
                              }}
                            >
                              <img
                                src={url}
                                alt={`Return image ${imageIndex + 1}`}
                                style={{
                                  width: "100%",
                                  height: "130px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border)",
                                }}
                              />

                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-secondary)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  marginTop: "6px",
                                }}
                              >
                                View Image <ExternalLink size={12} />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {request.videos?.length > 0 && (
                      <div>
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            margin: "0 0 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Video size={17} />
                          Uploaded Videos ({request.videos.length})
                        </h3>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(220px, 320px))",
                            gap: "14px",
                          }}
                        >
                          {request.videos.map((url, videoIndex) => (
                            <video
                              key={`${url}-${videoIndex}`}
                              src={url}
                              controls
                              preload="metadata"
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                                background: "#000",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div
                  style={{
                    padding: "12px 20px",
                    background: "var(--bg)",
                    borderTop: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    wordBreak: "break-all",
                  }}
                >
                  Request ID: {request.id}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "9px",
      }}
    >
      {icon && (
        <span style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
          {icon}
        </span>
      )}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-secondary)",
            marginBottom: "3px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "var(--text-primary)",
            fontWeight: 600,
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
