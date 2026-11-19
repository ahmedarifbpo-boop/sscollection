
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Plus,
  Receipt,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Wallet,
  Search,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  ShoppingBag,
} from "lucide-react";

type Expense = {
  id: string;
  date: string;
  type: "ADS" | "PACKAGING" | "OTHER";
  amount: number;
  note: string | null;
  createdAt: string;
};

type DailyRecord = {
  date: string;
  ordersCount: number;
  revenue: number;
  productCost: number;
  courierCost: number;
  orderProfit: number;
  expenses: number;
  netProfit: number;
  expenseBreakdown: {
    ADS: number;
    PACKAGING: number;
    OTHER: number;
  };
};

type ProfitReport = {
  period: {
    from: string;
    to: string;
    timezone: string;
  };
  summary: {
    ordersCount: number;
    revenue: number;
    productCost: number;
    courierCost: number;
    orderProfit: number;
    expenses: number;
    netProfit: number;
  };
  daily: DailyRecord[];
  orders: {
    id: string;
    orderNumber?: string;
    date: string;
    customerName?: string;
    revenue: number;
    productCost: number;
    courierCost: number;
    profit: number;
    items: {
      name: string;
      quantity: number;
      sellingPrice: number;
      actualCost: number;
      totalCost: number;
    }[];
  }[];
  expenses: {
    id: string;
    date: string;
    type: string;
    amount: number;
    note: string | null;
  }[];
};

const EXPENSE_TYPES = [
  { value: "ADS", label: "Advertising" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "OTHER", label: "Other" },
] as const;

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFirstDayOfMonth() {
  const date = new Date();
  date.setDate(1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatCurrency(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
}

const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "19px",
  minWidth: 0,
} as const;

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: "7px",
} as const;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [report, setReport] = useState<ProfitReport | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filterFrom, setFilterFrom] = useState(getFirstDayOfMonth());
  const [filterTo, setFilterTo] = useState(getLocalDate());
  const [search, setSearch] = useState("");

  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "expenses"
  >("overview");

  const [form, setForm] = useState({
    date: getLocalDate(),
    type: "ADS",
    amount: "",
    note: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        from: filterFrom,
        to: filterTo,
      });

      const [expenseResponse, profitResponse] = await Promise.all([
        fetch(`/api/expenses?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/expenses/profit?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (
        expenseResponse.status === 401 ||
        profitResponse.status === 401
      ) {
        window.location.href = "/admin/login";
        return;
      }

      const [expenseData, profitData] = await Promise.all([
        expenseResponse.json(),
        profitResponse.json(),
      ]);

      if (!expenseResponse.ok) {
        throw new Error(
          expenseData.error || "Failed to load expenses"
        );
      }

      if (!profitResponse.ok) {
        throw new Error(
          profitData.error || "Failed to load profit report"
        );
      }

      setExpenses(expenseData.expenses || []);
      setReport(profitData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [filterFrom, filterTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm({
      date: getLocalDate(),
      type: "ADS",
      amount: "",
      note: "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (expense: Expense) => {
    const date = new Date(expense.date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    setForm({
      date: `${year}-${month}-${day}`,
      type: expense.type,
      amount: String(expense.amount),
      note: expense.note || "",
    });

    setEditingId(expense.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const amount = Number(form.amount);

    if (!form.date) {
      setError("Please select an expense date.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingId
          ? `/api/expenses/${editingId}`
          : "/api/expenses",
        {
          method: editingId ? "PUT" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: new Date(`${form.date}T12:00:00+05:00`).toISOString(),
            type: form.type,
            amount,
            note: form.note.trim() || null,
          }),
        }
      );

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save expense.");
      }

      setSuccess(
        editingId
          ? "Expense updated successfully."
          : "Expense added successfully."
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save expense."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete expense.");
      }

      setSuccess("Expense deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete expense."
      );
    }
  };

  const summary = report?.summary;

  const filteredExpenses = expenses.filter((expense) => {
    const term = search.trim().toLowerCase();

    return (
      !term ||
      expense.note?.toLowerCase().includes(term) ||
      expense.type.toLowerCase().includes(term)
    );
  });

  const filteredOrders = (report?.orders || []).filter((order) => {
    const term = search.trim().toLowerCase();

    return (
      !term ||
      order.id.toLowerCase().includes(term) ||
      order.orderNumber?.toLowerCase().includes(term) ||
      order.customerName?.toLowerCase().includes(term) ||
      order.items.some((item) => item.name.toLowerCase().includes(term))
    );
  });

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Order Profit" },
    { id: "expenses", label: "Expense History" },
  ] as const;

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 650,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Expense & Profit
          </h1>

          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginTop: "6px",
            }}
          >
            Track business expenses, sales and net profit.
          </p>
        </div>

        <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="dz-btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({
                date: getLocalDate(),
                type: "ADS",
                amount: "",
                note: "",
              });
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
            className="dz-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            padding: "12px 14px",
            background: "#FEE2E2",
            color: "#B91C1C",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "12px 14px",
            background: "#D1FAE5",
            color: "#047857",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "18px",
          }}
        >
          {success}
        </div>
      )}

      {/* Date Filters */}
      <div
        className="dz-card"
        style={{
          padding: "17px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "13px",
            color: "var(--text-secondary)",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <CalendarDays size={16} />
          Report Period
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>From Date</label>
            <input
              type="date"
              value={filterFrom}
              max={filterTo}
              onChange={(event) => setFilterFrom(event.target.value)}
              className="dz-input"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={labelStyle}>To Date</label>
            <input
              type="date"
              value={filterTo}
              min={filterFrom}
              max={getLocalDate()}
              onChange={(event) => setFilterTo(event.target.value)}
              className="dz-input"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "end",
              fontSize: "12px",
              color: "var(--text-muted)",
              paddingBottom: "10px",
            }}
          >
            All dates use Pakistan time (UTC+5).
          </div>
        </div>
      </div>

      {/* Expense Form */}
      {showForm && (
        <div
          className="dz-card"
          style={{
            padding: "22px",
            marginBottom: "20px",
            maxWidth: "850px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {editingId ? "Edit Expense" : "Add New Expense"}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              aria-label="Close form"
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "15px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Expense Date *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      date: event.target.value,
                    }))
                  }
                  className="dz-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  required
                  value={form.type}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      type: event.target.value,
                    }))
                  }
                  className="dz-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                >
                  {EXPENSE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      amount: event.target.value,
                    }))
                  }
                  className="dz-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Description / Note</label>
              <textarea
                rows={3}
                placeholder="Enter expense details..."
                value={form.note}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    note: event.target.value,
                  }))
                }
                className="dz-input"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={saving}
                className="dz-btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? (
                  <Loader2 size={16} />
                ) : (
                  <Plus size={16} />
                )}
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Expense"
                    : "Save Expense"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="dz-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "13px",
          marginBottom: "20px",
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "13px",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Delivered Revenue
            </span>
            <ShoppingBag size={18} color="#3B82F6" />
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: 650,
              color: "var(--text-primary)",
            }}
          >
            {formatCurrency(summary?.revenue || 0)}
          </div>

          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "7px",
            }}
          >
            {summary?.ordersCount || 0} delivered orders
          </p>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "13px",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Product Cost
            </span>
            <Package size={18} color="#A78BFA" />
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: 650,
              color: "var(--text-primary)",
            }}
          >
            {formatCurrency(summary?.productCost || 0)}
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "13px",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Courier Cost
            </span>
            <Truck size={18} color="#F59E0B" />
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: 650,
              color: "var(--text-primary)",
            }}
          >
            {formatCurrency(summary?.courierCost || 0)}
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "13px",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Other Expenses
            </span>
            <Receipt size={18} color="#E67E22" />
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: 650,
              color: "var(--text-primary)",
            }}
          >
            {formatCurrency(summary?.expenses || 0)}
          </div>
        </div>
      </div>

      {/* Net Profit */}
      <div
        style={{
          ...cardStyle,
          marginBottom: "22px",
          padding: "23px",
          borderColor:
            (summary?.netProfit || 0) >= 0 ? "#16A34A55" : "#DC262655",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          {(summary?.netProfit || 0) >= 0 ? (
            <TrendingUp size={21} color="#16A34A" />
          ) : (
            <TrendingDown size={21} color="#DC2626" />
          )}

          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            Net Profit / Loss
          </span>
        </div>

        <div
          style={{
            fontSize: "clamp(25px, 4vw, 34px)",
            fontWeight: 700,
            color:
              (summary?.netProfit || 0) >= 0 ? "#16A34A" : "#DC2626",
          }}
        >
          {formatCurrency(summary?.netProfit || 0)}
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "8px",
          }}
        >
          Order profit: {formatCurrency(summary?.orderProfit || 0)}
          {" − "}
          Expenses: {formatCurrency(summary?.expenses || 0)}
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "7px",
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border)",
          marginBottom: "17px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "11px 15px",
              border: "none",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid var(--text-primary)"
                  : "2px solid transparent",
              background: "transparent",
              color:
                activeTab === tab.id
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="dz-card" style={{ padding: "20px" }}>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 17px",
            }}
          >
            Daily Profit & Loss
          </h2>

          {loading ? (
            <div
              style={{
                padding: "35px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <Loader2 size={23} />
              <p>Loading report...</p>
            </div>
          ) : !report?.daily.length ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              No records found for this period.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "750px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Date",
                      "Orders",
                      "Revenue",
                      "Product Cost",
                      "Courier",
                      "Expenses",
                      "Net Profit",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px 9px",
                          textAlign: "left",
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          borderBottom: "1px solid var(--border)",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {report.daily.map((day) => (
                    <tr
                      key={day.date}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td style={tableCellStyle}>
                        {formatDate(day.date)}
                      </td>
                      <td style={tableCellStyle}>{day.ordersCount}</td>
                      <td style={tableCellStyle}>
                        {formatCurrency(day.revenue)}
                      </td>
                      <td style={tableCellStyle}>
                        {formatCurrency(day.productCost)}
                      </td>
                      <td style={tableCellStyle}>
                        {formatCurrency(day.courierCost)}
                      </td>
                      <td style={tableCellStyle}>
                        {formatCurrency(day.expenses)}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          fontWeight: 650,
                          color: day.netProfit >= 0 ? "#16A34A" : "#DC2626",
                        }}
                      >
                        {formatCurrency(day.netProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Order Profit */}
      {activeTab === "orders" && (
        <div className="dz-card" style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Delivered Order Profit
            </h2>

            <SearchInput value={search} onChange={setSearch} />
          </div>

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              No delivered orders found.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "750px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Order",
                      "Date",
                      "Revenue",
                      "Product Cost",
                      "Courier",
                      "Profit",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px 9px",
                          textAlign: "left",
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          borderBottom: "1px solid var(--border)",
                          textTransform: "uppercase",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td style={tableCellStyle}>
                        {order.orderNumber || order.id.slice(-8)}
                      </td>
                      <td style={tableCellStyle}>
                        {formatDate(order.date)}
                      </td>
                      <td style={tableCellStyle}>
                        {formatCurrency(order.revenue)}
                      </td>
                      <td style={tableCellStyle}>
                        {formatCurrency(order.productCost)}
                      </td>
                      <td style={tableCellStyle}>
                        {formatCurrency(order.courierCost)}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          fontWeight: 650,
                          color: order.profit >= 0 ? "#16A34A" : "#DC2626",
                        }}
                      >
                        {formatCurrency(order.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expense History */}
      {activeTab === "expenses" && (
        <div className="dz-card" style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Expense History
              </h2>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "5px",
                }}
              >
                Add, edit and delete business expenses.
              </p>
            </div>

            <SearchInput value={search} onChange={setSearch} />
          </div>

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>
              Loading expenses...
            </p>
          ) : filteredExpenses.length === 0 ? (
            <div
              style={{
                padding: "35px 15px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <Receipt size={30} style={{ margin: "0 auto 10px" }} />
              <p>No expense records found.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "650px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Date",
                      "Category",
                      "Description",
                      "Amount",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px 9px",
                          textAlign: "left",
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          borderBottom: "1px solid var(--border)",
                          textTransform: "uppercase",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td style={tableCellStyle}>
                        {formatDate(expense.date)}
                      </td>
                      <td style={tableCellStyle}>
                        {EXPENSE_TYPES.find(
                          (type) => type.value === expense.type
                        )?.label || expense.type}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          maxWidth: "200px",
                        }}
                      >
                        {expense.note || "—"}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(expense.amount)}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", gap: "7px" }}>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEdit(expense)}
                            style={iconButtonStyle}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            onClick={() => deleteExpense(expense.id)}
                            style={{
                              ...iconButtonStyle,
                              color: "#DC2626",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--text-secondary)",
            zIndex: 20,
          }}
        >
          <Loader2 size={15} />
          Updating report...
        </div>
      )}
    </div>
  );
}

const tableCellStyle = {
  padding: "13px 9px",
  fontSize: "12px",
  color: "var(--text-secondary)",
  whiteSpace: "nowrap",
} as const;

const iconButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  border: "1px solid var(--border)",
  borderRadius: "5px",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
  cursor: "pointer",
} as const;

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ position: "relative", minWidth: "210px" }}>
      <Search
        size={15}
        style={{
          position: "absolute",
          left: "11px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
        }}
      />
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="dz-input"
        style={{
          width: "100%",
          boxSizing: "border-box",
          paddingLeft: "34px",
        }}
      />
    </div>
  );
}
