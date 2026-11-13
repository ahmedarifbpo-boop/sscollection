
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Database,
  Trash2,
  Calendar,
  RefreshCw,
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
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function AdminDashboard() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storageSize, setStorageSize] = useState("...");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }

        const data = await res.json();

        if (!data.authenticated) {
          router.replace("/admin/login");
          return;
        }

        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) router.replace("/admin/login");
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, storageRes] = await Promise.all([
        fetch("/api/orders", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/storage", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (ordersRes.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!ordersRes.ok) {
        throw new Error("Failed to fetch orders");
      }

      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);

      if (storageRes.ok) {
        const storageData = await storageRes.json();
        setStorageSize(storageData.size || "0 MB");
      } else {
        setStorageSize("Unavailable");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (ready) fetchData();
  }, [ready, fetchData]);

  const handleClearData = async () => {
    const confirmed = window.confirm(
      "Kya aap waqai saari orders aur chats delete karna chahte hain? Ye test data clear ho jayega."
    );

    if (!confirmed) return;

    setClearing(true);

    try {
      const res = await fetch("/api/clear-orders", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to clear data");

      await fetchData();
      alert("Data cleared successfully!");
    } catch {
      alert("Failed to clear data.");
    } finally {
      setClearing(false);
    }
  };

  const validOrders = orders.filter(
    (order) => order.status !== "CANCELLED"
  );

  const totalSales = validOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const totalOrders = orders.length;

  const avgOrderValue =
    validOrders.length > 0
      ? totalSales / validOrders.length
      : 0;

  const uniqueCustomers = new Set(
    orders.map((order) => order.customerPhone)
  ).size;

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.status === "CANCELLED"
  ).length;

  const todayStr = new Date().toLocaleDateString("en-CA");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA");

  const dayBefore = new Date();
  dayBefore.setDate(dayBefore.getDate() - 2);
  const dayBeforeStr = dayBefore.toLocaleDateString("en-CA");

  const calculateDayStats = (dateStr: string) => {
    const dayOrders = orders.filter(
      (order) =>
        new Date(order.createdAt).toLocaleDateString("en-CA") === dateStr
    );

    const valid = dayOrders.filter(
      (order) => order.status !== "CANCELLED"
    );

    return {
      orders: dayOrders.length,
      sales: valid.reduce((sum, order) => sum + order.total, 0),
      cancelled: dayOrders.filter(
        (order) => order.status === "CANCELLED"
      ).length,
    };
  };

  const todayStats = calculateDayStats(todayStr);
  const yesterdayStats = calculateDayStats(yesterdayStr);
  const dayBeforeStats = calculateDayStats(dayBeforeStr);

  const stats = [
    {
      label: "Total Sales",
      value: `Rs. ${totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: "#F85606",
      bg: "#FFF1E9",
    },
    {
      label: "Total Orders",
      value: totalOrders.toString(),
      icon: ShoppingBag,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      label: "Customers",
      value: uniqueCustomers.toString(),
      icon: Users,
      color: "#0891B2",
      bg: "#ECFEFF",
    },
    {
      label: "Average Order",
      value: `Rs. ${Math.round(avgOrderValue).toLocaleString()}`,
      icon: TrendingUp,
      color: "#059669",
      bg: "#ECFDF5",
    },
  ];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatMoney = (amount: number) =>
    `Rs. ${amount.toLocaleString()}`;

  if (!ready || loading) {
    return (
      <div className="dashboard-loading">
        <RefreshCw size={22} className="loading-icon" />
        <p>Loading dashboard...</p>

        <style jsx>{`
          .dashboard-loading {
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            color: var(--text-muted);
          }

          .loading-icon {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <style jsx>{`
        .dashboard {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding: 8px 0 32px;
          color: var(--text-primary);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 26px;
        }

        .page-title {
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
          margin: 0 0 6px;
        }

        .page-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .refresh-btn,
        .clear-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .refresh-btn {
          background: var(--bg-alt);
          color: var(--text-primary);
          border: 1px solid var(--border);
        }

        .clear-btn {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .refresh-btn:hover,
        .clear-btn:hover {
          transform: translateY(-1px);
        }

        .refresh-btn:disabled,
        .clear-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .storage-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--bg-card, var(--bg));
        }

        .storage-icon {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #FFF7ED;
          color: #EA580C;
        }

        .eyebrow {
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 5px;
        }

        .storage-value {
          font-size: 21px;
          font-weight: 750;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          min-width: 0;
          padding: 19px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--bg-card, var(--bg));
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          margin-bottom: 15px;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 650;
          color: var(--text-muted);
          margin-bottom: 7px;
        }

        .stat-value {
          font-size: clamp(17px, 2vw, 23px);
          font-weight: 800;
          letter-spacing: -0.5px;
          overflow-wrap: anywhere;
        }

        .section-card {
          padding: 21px;
          margin-bottom: 20px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--bg-card, var(--bg));
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 15px;
          font-weight: 750;
          margin: 0;
        }

        .section-icon {
          color: var(--accent);
        }

        .daily-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
        }

        .daily-card {
          padding: 17px;
          border-radius: 10px;
          background: var(--bg-alt);
          border: 1px solid var(--border);
          min-width: 0;
        }

        .daily-title {
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 10px;
        }

        .daily-sales {
          font-size: 19px;
          font-weight: 800;
          margin-bottom: 6px;
          overflow-wrap: anywhere;
        }

        .daily-meta {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
        }

        .status-card {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 15px;
          border-radius: 10px;
          background: var(--bg-alt);
          border: 1px solid var(--border);
          min-width: 0;
        }

        .status-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }

        .status-number {
          font-size: 21px;
          font-weight: 800;
          line-height: 1.2;
        }

        .status-label {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .view-all {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--accent);
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
        }

        .order-row {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 14px 8px;
          border-bottom: 1px solid var(--border);
          text-decoration: none;
          transition: background 0.2s ease;
          border-radius: 7px;
          min-width: 0;
        }

        .order-row:last-child {
          border-bottom: none;
        }

        .order-row:hover {
          background: var(--bg-alt);
        }

        .order-icon {
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
        }

        .order-info {
          flex: 1;
          min-width: 0;
        }

        .customer-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 5px;
        }

        .order-meta {
          font-size: 11px;
          color: var(--text-muted);
          overflow-wrap: anywhere;
        }

        .order-right {
          text-align: right;
          flex-shrink: 0;
        }

        .order-total {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 5px;
        }

        .order-status {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .empty-state {
          padding: 45px 15px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        .empty-icon {
          margin: 0 auto 12px;
          opacity: 0.4;
        }

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .dashboard {
            padding: 2px 0 24px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 18px;
          }

          .page-title {
            font-size: 22px;
          }

          .header-actions {
            width: 100%;
          }

          .refresh-btn,
          .clear-btn {
            flex: 1;
            min-height: 42px;
            padding: 0 9px;
            font-size: 11px;
          }

          .storage-card {
            padding: 15px;
            margin-bottom: 14px;
          }

          .storage-icon {
            width: 42px;
            height: 42px;
          }

          .storage-value {
            font-size: 18px;
          }

          .stats-grid {
            gap: 10px;
            margin-bottom: 14px;
          }

          .stat-card {
            padding: 14px;
            border-radius: 11px;
          }

          .stat-icon {
            width: 36px;
            height: 36px;
            margin-bottom: 11px;
          }

          .stat-value {
            font-size: 18px;
          }

          .section-card {
            padding: 15px;
            margin-bottom: 14px;
            border-radius: 11px;
          }

          .section-heading {
            margin-bottom: 13px;
          }

          .section-title {
            font-size: 13px;
          }

          .daily-grid {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .daily-card {
            padding: 13px;
          }

          .daily-title {
            margin-bottom: 6px;
          }

          .daily-sales {
            font-size: 18px;
          }

          .status-grid {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .status-card {
            padding: 12px;
          }

          .status-icon {
            width: 38px;
            height: 38px;
          }

          .status-number {
            font-size: 19px;
          }

          .order-row {
            gap: 9px;
            padding: 13px 3px;
          }

          .order-icon {
            width: 36px;
            height: 36px;
          }

          .customer-name {
            font-size: 12px;
          }

          .order-meta {
            font-size: 10px;
          }

          .order-total {
            font-size: 11px;
          }

          .order-status {
            font-size: 8px;
          }
        }

        @media (max-width: 360px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            display: flex;
            align-items: center;
            gap: 13px;
          }

          .stat-icon {
            margin: 0;
          }

          .stat-content {
            min-width: 0;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back! Here is your store overview.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={fetchData}
            type="button"
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          {totalOrders > 0 && (
            <button
              className="clear-btn"
              onClick={handleClearData}
              disabled={clearing}
              type="button"
            >
              <Trash2 size={14} />
              {clearing ? "Clearing..." : "Clear Test Data"}
            </button>
          )}
        </div>
      </div>

      <div className="storage-card">
        <div className="storage-icon">
          <Database size={23} />
        </div>

        <div>
          <div className="eyebrow">Database Storage Used</div>
          <div className="storage-value">{storageSize}</div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="stat-card" key={stat.label}>
              <div
                className="stat-icon"
                style={{
                  color: stat.color,
                  background: stat.bg,
                }}
              >
                <Icon size={20} />
              </div>

              <div className="stat-content">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="section-card">
        <div className="section-heading">
          <h2 className="section-title">
            <Calendar size={17} className="section-icon" />
            Daily Sales History
          </h2>
        </div>

        <div className="daily-grid">
          {[
            { title: "Today", data: todayStats },
            { title: "Yesterday", data: yesterdayStats },
            { title: "Day Before", data: dayBeforeStats },
          ].map((day) => (
            <div className="daily-card" key={day.title}>
              <div className="daily-title">{day.title}</div>
              <div className="daily-sales">
                {formatMoney(day.data.sales)}
              </div>
              <div className="daily-meta">
                {day.data.orders} Orders · {day.data.cancelled} Cancelled
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2 className="section-title">
            <ShoppingBag size={17} className="section-icon" />
            Order Status Summary
          </h2>
        </div>

        <div className="status-grid">
          <div className="status-card">
            <div
              className="status-icon"
              style={{ background: "#FFF7ED", color: "#EA580C" }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div className="status-number">{pendingOrders}</div>
              <div className="status-label">Pending Orders</div>
            </div>
          </div>

          <div className="status-card">
            <div
              className="status-icon"
              style={{ background: "#ECFDF5", color: "#059669" }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="status-number">{deliveredOrders}</div>
              <div className="status-label">Delivered Orders</div>
            </div>
          </div>

          <div className="status-card">
            <div
              className="status-icon"
              style={{ background: "#FEF2F2", color: "#DC2626" }}
            >
              <XCircle size={20} />
            </div>
            <div>
              <div className="status-number">{cancelledOrders}</div>
              <div className="status-label">Cancelled Orders</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2 className="section-title">
            <Package size={17} className="section-icon" />
            Recent Orders
          </h2>

          <Link href="/admin/orders" className="view-all">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={34} className="empty-icon" />
            <div>No orders yet</div>
          </div>
        ) : (
          <div className="orders-list">
            {orders.slice(0, 5).map((order) => {
              const isCancelled = order.status === "CANCELLED";

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="order-row"
                >
                  <div
                    className="order-icon"
                    style={{
                      background: isCancelled ? "#FEF2F2" : "#ECFDF5",
                      color: isCancelled ? "#DC2626" : "#059669",
                    }}
                  >
                    {isCancelled ? (
                      <XCircle size={19} />
                    ) : (
                      <Package size={19} />
                    )}
                  </div>

                  <div className="order-info">
                    <div className="customer-name">
                      {order.customerName}
                    </div>
                    <div className="order-meta">
                      {order.orderNumber} · {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div className="order-right">
                    <div className="order-total">
                      {formatMoney(order.total)}
                    </div>
                    <div
                      className="order-status"
                      style={{
                        color: isCancelled ? "#DC2626" : "#059669",
                      }}
                    >
                      {order.status}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
