
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  CheckCircle2,
  XCircle,
  Search,
  User,
} from "lucide-react";

export default function AdminReferralsPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Verify admin session and fetch referrals
  useEffect(() => {
    let cancelled = false;

    async function fetchReferrals() {
      try {
        // Check admin session
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
          throw new Error("Session verification failed");
        }

        const sessionData = await sessionRes.json();

        if (!sessionData.authenticated) {
          router.replace("/admin/login");
          return;
        }

        // Fetch referrals
        const res = await fetch("/api/admin/referrals", {
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch referrals");
        }

        const data = await res.json();

        if (!cancelled) {
          setCustomers(data.customers || []);
        }
      } catch (error) {
        console.error("Referral fetch error:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchReferrals();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Enable / Disable referral
  const toggleReferStatus = async (
    id: string,
    currentStatus: boolean
  ) => {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: id,
          canRefer: !currentStatus,
        }),
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, canRefer: !currentStatus }
              : c
          )
        );
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error("Referral status update error:", error);
      alert("Failed to update status.");
    }
  };

  // Search customers
  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (c.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (c.referralCode || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div
        style={{
          padding: "60px",
          textAlign: "center",
        }}
      >
        Loading referrals...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
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
            Referral System
          </h1>

          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            Manage customer referrals and coins
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div
        className="dz-card"
        style={{
          padding: "12px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Search
          size={18}
          style={{ color: "var(--text-muted)" }}
        />

        <input
          type="text"
          placeholder="Search by name, email or referral code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="dz-input"
          style={{
            border: "none",
            background: "transparent",
            width: "100%",
            padding: 0,
          }}
        />
      </div>

      {/* No Referrals */}
      {filteredCustomers.length === 0 ? (
        <div
          className="dz-card"
          style={{
            padding: "60px",
            textAlign: "center",
          }}
        >
          <Gift
            size={48}
            style={{
              color: "var(--border-strong)",
              margin: "0 auto 16px",
            }}
          />

          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--text-primary)",
            }}
          >
            No referrals found
          </h2>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="dz-card"
              style={{
                padding: "20px",
                borderLeft: customer.canRefer
                  ? "4px solid #10B981"
                  : "4px solid #EF4444",
              }}
            >
              {/* Header: Customer Info + Status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "12px",
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
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "var(--bg-alt)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "var(--accent)",
                    }}
                  >
                    {(customer.name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      {customer.name}
                    </h3>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {customer.email} • {customer.phone}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontWeight: "600",
                      }}
                    >
                      Referral Code
                    </p>

                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "var(--accent)",
                      }}
                    >
                      {customer.referralCode}
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() =>
                      toggleReferStatus(
                        customer.id,
                        customer.canRefer
                      )
                    }
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: customer.canRefer
                        ? "#FEE"
                        : "#F0FDF4",
                      color: customer.canRefer
                        ? "#EF4444"
                        : "#10B981",
                    }}
                  >
                    {customer.canRefer ? (
                      <>
                        <XCircle size={14} />
                        Disable Refer
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        Enable Refer
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    background: "#F9FAFB",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#6B7280",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Total Referrals
                  </p>

                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#1B1B1C",
                    }}
                  >
                    {customer.totalReferrals}
                  </p>
                </div>

                <div
                  style={{
                    background: "#FFFBEB",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #FDE68A",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#B45309",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Coins Earned (Ref)
                  </p>

                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#D97706",
                    }}
                  >
                    Rs. {customer.totalReferralCoinsEarned}
                  </p>
                </div>

                <div
                  style={{
                    background: "#F0FDF4",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #DCFCE7",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#047857",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Current Coins
                  </p>

                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#047857",
                    }}
                  >
                    Rs. {customer.coins}
                  </p>
                </div>
              </div>

              {/* Referred Customers List */}
              <div
                style={{
                  background: "var(--bg-alt)",
                  padding: "12px",
                  borderRadius: "6px",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Referred Customers
                </p>

                {customer.logs && customer.logs.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {customer.logs.map((log: any) => (
                      <div
                        key={log.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <User
                            size={14}
                            style={{
                              color: "var(--text-muted)",
                            }}
                          />

                          <span
                            style={{
                              color: "var(--text-primary)",
                            }}
                          >
                            {log.referredEmail}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background:
                              log.status === "COMPLETED"
                                ? "#DCFCE7"
                                : "#FEF3C7",
                            color:
                              log.status === "COMPLETED"
                                ? "#047857"
                                : "#B45309",
                          }}
                        >
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    No referrals yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
