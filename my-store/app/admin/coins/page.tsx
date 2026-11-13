
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Search, TrendingUp, TrendingDown } from "lucide-react";

interface CustomerCoins {
  id: string;
  name: string;
  email: string;
  phone: string;
  currentCoins: number;
  totalEarned: number;
  totalUsed: number;
  referralEarned: number;
}

export default function AdminCoinsPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerCoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");

  // Screen size check
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // HTTP-only cookie session check
  useEffect(() => {
    let cancelled = false;

    async function loadCoins() {
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

        const res = await fetch("/api/admin/coins", {
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
          throw new Error(data.error || "Could not load coins data.");
        }

        if (!cancelled) {
          setCustomers(data.customers || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCoins();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Overall Stats
  const totalCoinsInCirculation = customers.reduce(
    (sum, c) => sum + c.currentCoins,
    0
  );

  const totalCoinsEarned = customers.reduce(
    (sum, c) => sum + c.totalEarned,
    0
  );

  const totalCoinsUsed = customers.reduce(
    (sum, c) => sum + c.totalUsed,
    0
  );

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        Loading coins data...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "600",
            color: "var(--text-primary)",
          }}
        >
          Coins Management
        </h1>

        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Track all customer coins, earnings and usage
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "#FEF2F2",
            color: "#B91C1C",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Top Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          className="dz-card"
          style={{ padding: "16px", borderLeft: "4px solid #D97706" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                background: "#FFFBEB",
                padding: "6px",
                borderRadius: "6px",
                color: "#D97706",
              }}
            >
              <Coins size={16} />
            </div>

            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              Active Coins
            </span>
          </div>

          <div
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "var(--text-primary)",
            }}
          >
            Rs. {totalCoinsInCirculation.toLocaleString()}
          </div>
        </div>

        <div
          className="dz-card"
          style={{ padding: "16px", borderLeft: "4px solid #10B981" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                background: "#F0FDF4",
                padding: "6px",
                borderRadius: "6px",
                color: "#10B981",
              }}
            >
              <TrendingUp size={16} />
            </div>

            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              Total Earned
            </span>
          </div>

          <div
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "var(--text-primary)",
            }}
          >
            Rs. {totalCoinsEarned.toLocaleString()}
          </div>
        </div>

        <div
          className="dz-card"
          style={{ padding: "16px", borderLeft: "4px solid #EF4444" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                background: "#FEF2F2",
                padding: "6px",
                borderRadius: "6px",
                color: "#EF4444",
              }}
            >
              <TrendingDown size={16} />
            </div>

            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              Total Used
            </span>
          </div>

          <div
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "var(--text-primary)",
            }}
          >
            Rs. {totalCoinsUsed.toLocaleString()}
          </div>
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
        <Search size={18} style={{ color: "var(--text-muted)" }} />

        <input
          type="text"
          placeholder="Search by customer name or email..."
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

      {/* Mobile Card View */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredCustomers.length === 0 ? (
            <div
              className="dz-card"
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "14px",
              }}
            >
              No customers found.
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div key={c.id} className="dz-card" style={{ padding: "16px" }}>
                <div
                  style={{
                    marginBottom: "12px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                    }}
                  >
                    {c.name}
                  </div>

                  <div
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    {c.email}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      background: "#FFFBEB",
                      padding: "10px",
                      borderRadius: "6px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#B45309",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                      }}
                    >
                      Current
                    </p>

                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#D97706",
                      }}
                    >
                      Rs. {c.currentCoins.toLocaleString()}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#F0FDF4",
                      padding: "10px",
                      borderRadius: "6px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#047857",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                      }}
                    >
                      Earned
                    </p>

                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#10B981",
                      }}
                    >
                      + Rs. {c.totalEarned.toLocaleString()}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#FEF2F2",
                      padding: "10px",
                      borderRadius: "6px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#B91C1C",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                      }}
                    >
                      Used
                    </p>

                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#EF4444",
                      }}
                    >
                      - Rs. {c.totalUsed.toLocaleString()}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#EFF6FF",
                      padding: "10px",
                      borderRadius: "6px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#1D4ED8",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                      }}
                    >
                      Referral
                    </p>

                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#3B82F6",
                      }}
                    >
                      Rs. {c.referralEarned.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="dz-card" style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "800px",
            }}
          >
            <thead
              style={{
                background: "var(--bg-alt)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <tr>
                {["Customer", "Current", "Earned (3%)", "Used", "Referral"].map(
                  (heading, index) => (
                    <th
                      key={heading}
                      style={{
                        padding: "12px 16px",
                        textAlign: index === 0 ? "left" : "right",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "14px",
                    }}
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "var(--text-primary)",
                        }}
                      >
                        {c.name}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {c.email}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#D97706",
                      }}
                    >
                      Rs. {c.currentCoins.toLocaleString()}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#10B981",
                      }}
                    >
                      + Rs. {c.totalEarned.toLocaleString()}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#EF4444",
                      }}
                    >
                      - Rs. {c.totalUsed.toLocaleString()}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#3B82F6",
                      }}
                    >
                      Rs. {c.referralEarned.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
