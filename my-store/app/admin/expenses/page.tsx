
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, RefreshCw, Search, Pencil, Trash2, X, Wallet,
  Save, Loader2, ChevronDown, Check,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  costPrice: number;
  stock: number;
};

type SheetRow = {
  id: string;
  date: string;
  productId: string | null;
  productName: string;
  actualPrice: number;
  websitePrice: number;
  personalExpense: number;
  businessExpense: number;
  discountSalePrice: number;
  discountQuantity: number;
  note: string | null;
  customValues: Record<string, string | number> | null;
};

type Sale = {
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  salesAmount: number;
  actualCost: number;
};

type Payment = {
  id: string;
  person: string;
  amount: number;
  date: string;
  note: string | null;
};

type Column = {
  id: string;
  name: string;
  kind: string;
  position: number;
};

type SheetData = {
  products: Product[];
  rows: SheetRow[];
  settings: { accountBalance: number; actualCountedBalance: number };
  payments: Payment[];
  columns: Column[];
  sales: Sale[];
};

const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });

const firstDay = () => `${today().slice(0, 7)}-01`;

const dateValue = (value: string) =>
  new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });

const money = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const numberValue = (value: unknown) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #CBD5E1",
  borderRadius: 8,
  padding: "10px 11px",
  background: "#FFFFFF",
  color: "#0F172A",
  fontSize: 13,
  outline: "none",
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 11,
  padding: 17,
  minWidth: 0,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  border: "1px solid #CBD5E1",
  borderRadius: 8,
  padding: "9px 13px",
  background: "#FFFFFF",
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  minHeight: 36,
  flexShrink: 0,
};

const primaryButton: React.CSSProperties = {
  ...buttonStyle,
  background: "#173B67",
  color: "#FFFFFF",
  borderColor: "#173B67",
};

function Field({
  label,
  value,
  onChange,
  type = "number",
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{
        display: "block",
        fontSize: 11,
        fontWeight: 650,
        color: "#475569",
        marginBottom: 6,
      }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function Metric({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: number;
  detail?: string;
  color?: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={{
        color: "var(--text-muted)",
        fontSize: 11,
        fontWeight: 600,
        marginBottom: 10,
      }}>{label}</div>
      <div style={{
        color: color || "var(--text-primary)",
        fontSize: 21,
        fontWeight: 750,
        overflowWrap: "anywhere",
      }}>{money(value)}</div>
      {detail && <div style={{
        color: "var(--text-muted)",
        fontSize: 11,
        marginTop: 7,
      }}>{detail}</div>}
    </div>
  );
}

/* Searchable product dropdown */
function ProductSearchSelect({
  products,
  value,
  onChange,
}: {
  products: Product[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find((p) => p.id === value);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const openDropdown = () => {
    setOpen(true);
    setQuery("");
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        display: "block",
        minWidth: 0,
        position: "relative",
        zIndex: open ? 100 : 1,
      }}
    >
      <label style={{
        display: "block",
        fontSize: 11,
        fontWeight: 650,
        color: "#475569",
        marginBottom: 6,
      }}>
        Product
      </label>

      <div style={{ position: "relative" }}>
        <input
          ref={searchRef}
          type="text"
          autoComplete="off"
          value={open ? query : (selectedProduct?.name || "General Expense / No Product")}
          placeholder="Search product..."
          onFocus={() => {
            if (!open) {
              setOpen(true);
              setQuery("");
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          style={{
            ...inputStyle,
            paddingRight: 37,
            cursor: "text",
          }}
        />

        <button
          type="button"
          onClick={() => open ? setOpen(false) : openDropdown()}
          aria-label="Toggle product list"
          style={{
            position: "absolute",
            right: 5,
            top: 5,
            width: 29,
            height: 29,
            display: "grid",
            placeItems: "center",
            border: 0,
            borderRadius: 6,
            background: "#F1F5F9",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 5px)",
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "#FFFFFF",
          border: "1px solid #CBD5E1",
          borderRadius: 9,
          boxShadow: "0 14px 35px rgba(15,23,42,.20)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: 9,
            borderBottom: "1px solid #E2E8F0",
            background: "#F8FAFC",
          }}>
            <div style={{ position: "relative" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 10,
                  top: 11,
                  color: "#64748B",
                }}
              />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type product name to search..."
                style={{
                  ...inputStyle,
                  paddingLeft: 33,
                  background: "#FFFFFF",
                }}
              />
            </div>
          </div>

          <div style={{
            maxHeight: 220,
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: 5,
          }}>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setQuery("");
              }}
              style={{
                width: "100%",
                padding: "10px 11px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: 0,
                borderRadius: 6,
                background: value === "" ? "#EFF6FF" : "#FFFFFF",
                color: "#0F172A",
                textAlign: "left",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <span>General Expense / No Product</span>
              {value === "" && <Check size={15} color="#2563EB" />}
            </button>

            {filteredProducts.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => {
                  onChange(product.id);
                  setOpen(false);
                  setQuery("");
                }}
                style={{
                  width: "100%",
                  padding: "10px 11px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  border: 0,
                  borderRadius: 6,
                  background: value === product.id ? "#EFF6FF" : "#FFFFFF",
                  color: "#0F172A",
                  textAlign: "left",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F1F5F9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    value === product.id ? "#EFF6FF" : "#FFFFFF";
                }}
              >
                <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  {product.name}
                </span>
                {value === product.id && <Check size={15} color="#2563EB" />}
              </button>
            ))}

            {filteredProducts.length === 0 && (
              <div style={{
                padding: 20,
                textAlign: "center",
                color: "#64748B",
                fontSize: 12,
              }}>
                No products found for "{query}".
              </div>
            )}
          </div>

          <div style={{
            borderTop: "1px solid #E2E8F0",
            padding: "7px 10px",
            color: "#64748B",
            fontSize: 10,
            background: "#F8FAFC",
          }}>
            {filteredProducts.length} product(s) found
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  const [data, setData] = useState<SheetData | null>(null);
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"sheet" | "profit" | "payments">("sheet");

  const [showRowForm, setShowRowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: today(),
    productId: "",
    actualPrice: "0",
    websitePrice: "0",
    personalExpense: "0",
    businessExpense: "0",
    discountSalePrice: "0",
    discountQuantity: "0",
    note: "",
  });

  const [accountBalance, setAccountBalance] = useState("0");
  const [actualBalance, setActualBalance] = useState("0");
  const [paymentPerson, setPaymentPerson] = useState("Ahmad");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentNote, setPaymentNote] = useState("");
  const [columnName, setColumnName] = useState("");
  const [columnKind, setColumnKind] = useState("TEXT");

  useEffect(() => {
    if (!showRowForm) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showRowForm]);

  const request = useCallback(async (
    method: string,
    body?: Record<string, unknown>,
  ) => {
    const response = await fetch("/api/expenses/sheet", {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      window.location.href = "/admin/login";
      throw new Error("Admin session expired.");
    }

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed.");
    return result;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ from, to });
      const response = await fetch(`/api/expenses/sheet?${params}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const filtered = await response.json();

      if (!response.ok) {
        throw new Error(filtered.error || "Could not load sheet.");
      }

      setData(filtered);
      setAccountBalance(String(filtered.settings?.accountBalance ?? 0));
      setActualBalance(String(filtered.settings?.actualCountedBalance ?? 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load expense sheet.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const salesByProductDay = useMemo(() => {
    const map = new Map<string, Sale>();

    for (const sale of data?.sales || []) {
      map.set(`${sale.date}:${sale.productId}`, sale);
    }

    return map;
  }, [data?.sales]);

  const displayRows = useMemo(() => {
    const rows = (data?.rows || []).map((row) => {
      const date = dateValue(row.date);
      const sale = row.productId
        ? salesByProductDay.get(`${date}:${row.productId}`)
        : undefined;

      return { ...row, date, sale };
    });

    for (const sale of data?.sales || []) {
      const exists = rows.some(
        (row) => row.date === sale.date && row.productId === sale.productId,
      );

      if (!exists) {
        rows.push({
          id: `auto-${sale.date}-${sale.productId}`,
          date: sale.date,
          productId: sale.productId,
          productName: sale.productName,
          actualPrice: sale.quantity ? sale.actualCost / sale.quantity : 0,
          websitePrice: 0,
          personalExpense: 0,
          businessExpense: 0,
          discountSalePrice: 0,
          discountQuantity: 0,
          note: null,
          customValues: null,
          sale,
        });
      }
    }

    return rows.sort((a, b) =>
      a.date.localeCompare(b.date) ||
      a.productName.localeCompare(b.productName),
    );
  }, [data, salesByProductDay]);

  const totals = useMemo(() => {
    const rows = displayRows;

    const personal = rows.reduce((sum, row) => sum + row.personalExpense, 0);
    const business = rows.reduce((sum, row) => sum + row.businessExpense, 0);
    const totalExpense = personal + business;

    const profit1 = rows.reduce(
      (sum, row) => sum + (row.sale?.salesAmount || 0), 0,
    );

    const actualP1 = rows.reduce(
      (sum, row) => sum +
        ((row.sale?.salesAmount || 0) - (row.sale?.actualCost || 0)), 0,
    );

    const profit2 = rows.reduce(
      (sum, row) => sum + row.discountSalePrice * row.discountQuantity, 0,
    );

    const actualP2 = rows.reduce(
      (sum, row) => sum +
        ((row.discountSalePrice - row.actualPrice) * row.discountQuantity), 0,
    );

    const balance = numberValue(accountBalance);
    const counted = numberValue(actualBalance);
    const remaining = balance - totalExpense;
    const expected = totalExpense + remaining;
    const actualProfit = actualP1 + actualP2;

    const ahmadShare = actualProfit / 2;
    const sidraShare = actualProfit / 2;

    const paidAhmad = (data?.payments || [])
      .filter((p) => p.person === "Ahmad")
      .reduce((sum, p) => sum + p.amount, 0);

    const paidSidra = (data?.payments || [])
      .filter((p) => p.person === "Sidra")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      personal, business, totalExpense, balance, counted, remaining,
      expected, difference: expected - counted,
      profit1, profit2, subProfit: profit1 + profit2,
      actualP1, actualP2, actualProfit, ahmadShare, sidraShare,
      paidAhmad, paidSidra,
      remainingAhmad: ahmadShare - paidAhmad,
      remainingSidra: sidraShare - paidSidra,
    };
  }, [displayRows, accountBalance, actualBalance, data?.payments]);

  const filteredRows = displayRows.filter((row) => {
    const q = search.trim().toLowerCase();

    return !q ||
      row.productName.toLowerCase().includes(q) ||
      row.note?.toLowerCase().includes(q) ||
      row.date.includes(q);
  });

  const openNewRow = () => {
    setEditingId(null);

    setForm({
      date: today(),
      productId: "",
      actualPrice: "0",
      websitePrice: "0",
      personalExpense: "0",
      businessExpense: "0",
      discountSalePrice: "0",
      discountQuantity: "0",
      note: "",
    });

    setShowRowForm(true);
    setError("");
  };

  const openEditRow = (row: (typeof displayRows)[number]) => {
    setEditingId(row.id.startsWith("auto-") ? null : row.id);

    setForm({
      date: row.date,
      productId: row.productId || "",
      actualPrice: String(row.actualPrice),
      websitePrice: String(row.websitePrice),
      personalExpense: String(row.personalExpense),
      businessExpense: String(row.businessExpense),
      discountSalePrice: String(row.discountSalePrice),
      discountQuantity: String(row.discountQuantity),
      note: row.note || "",
    });

    setShowRowForm(true);
    setError("");
  };

  const selectProduct = (id: string) => {
    const product = data?.products.find((p) => p.id === id);

    setForm((old) => ({
      ...old,
      productId: id,
      actualPrice: String(product?.costPrice ?? 0),
      websitePrice: String(product?.salePrice ?? 0),
      discountSalePrice: String(product?.salePrice ?? 0),
    }));
  };

  const saveRow = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const body = {
        action: "row",
        ...form,
        actualPrice: numberValue(form.actualPrice),
        websitePrice: numberValue(form.websitePrice),
        personalExpense: numberValue(form.personalExpense),
        businessExpense: numberValue(form.businessExpense),
        discountSalePrice: numberValue(form.discountSalePrice),
        discountQuantity: Math.max(
          0,
          Math.floor(numberValue(form.discountQuantity)),
        ),
        productId: form.productId || null,
      };

      await request(editingId ? "PATCH" : "POST", {
        ...body,
        ...(editingId ? { id: editingId } : {}),
      });

      setShowRowForm(false);
      setSuccess(editingId ? "Row updated." : "Row saved.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save row.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (id: string) => {
    if (!window.confirm("Delete this expense sheet row?")) return;

    try {
      await request("DELETE", { action: "row", id });
      setSuccess("Row deleted.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete row.");
    }
  };

  const saveBalances = async () => {
    setSaving(true);
    setError("");

    try {
      await request("POST", {
        action: "settings",
        accountBalance: numberValue(accountBalance),
        actualCountedBalance: numberValue(actualBalance),
      });

      setSuccess("Account balances saved.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save balances.");
    } finally {
      setSaving(false);
    }
  };

  const addPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await request("POST", {
        action: "payment",
        person: paymentPerson,
        amount: numberValue(paymentAmount),
        date: paymentDate,
        note: paymentNote,
      });

      setPaymentAmount("");
      setPaymentNote("");
      setSuccess(`${paymentPerson} payment saved.`);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save payment.");
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = async (id: string) => {
    if (!window.confirm("Delete this payment record?")) return;

    try {
      await request("DELETE", { action: "payment", id });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete payment.");
    }
  };

  const addColumn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!columnName.trim()) return;

    try {
      await request("POST", {
        action: "column",
        name: columnName.trim(),
        kind: columnKind,
      });

      setColumnName("");
      setSuccess("Custom column added.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add column.");
    }
  };

  const tableCell: React.CSSProperties = {
    padding: "12px 10px",
    borderBottom: "1px solid var(--border)",
    fontSize: 12,
    whiteSpace: "nowrap",
    color: "var(--text-secondary)",
  };

  return (
    <main style={{
      maxWidth: 1600,
      margin: "0 auto",
      paddingBottom: 35,
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 14,
        marginBottom: 22,
      }}>
        <div>
          <h1 style={{
            fontSize: 25,
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-.5px",
          }}>Expense Sheet</h1>

          <p style={{
            fontSize: 12,
            color: "var(--text-muted)",
            margin: "6px 0 0",
          }}>S.S Collection · Business accounts and profit management</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={buttonStyle} onClick={loadData} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>

          <button style={primaryButton} onClick={openNewRow}>
            <Plus size={15} /> Add Row
          </button>
        </div>
      </header>

      {error && (
        <div style={{
          background: "#FEE2E2",
          color: "#991B1B",
          padding: 12,
          borderRadius: 8,
          marginBottom: 14,
          fontSize: 13,
        }}>{error}</div>
      )}

      {success && (
        <div style={{
          background: "#DCFCE7",
          color: "#166534",
          padding: 12,
          borderRadius: 8,
          marginBottom: 14,
          fontSize: 13,
        }}>{success}</div>
      )}

      <section style={{
        ...cardStyle,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: 13,
        marginBottom: 18,
      }}>
        <Field label="From date" type="date" value={from} onChange={setFrom} />
        <Field label="To date" type="date" value={to} onChange={setTo} />

        <div style={{ display: "flex", alignItems: "end" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            All dates use Pakistan time (UTC+5).
          </span>
        </div>
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
        gap: 12,
        marginBottom: 18,
      }}>
        <Metric label="Account Balance" value={totals.balance} />

        <Metric
          label="Total Expense"
          value={totals.totalExpense}
          color="#B45309"
          detail={`Personal ${money(totals.personal)} · Business ${money(totals.business)}`}
        />

        <Metric
          label="Remaining Balance"
          value={totals.remaining}
          color={totals.remaining >= 0 ? "#15803D" : "#DC2626"}
        />

        <Metric label="Actual Counted Balance" value={totals.counted} />

        <Metric
          label="Account Difference"
          value={totals.difference}
          color={Math.abs(totals.difference) < 0.01 ? "#15803D" : "#DC2626"}
          detail="Expected balance minus counted balance"
        />
      </section>

      <section style={{ ...cardStyle, marginBottom: 18 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 14,
          color: "var(--text-primary)",
        }}>
          <Wallet size={17} /> Account Balance Settings
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: 12,
          alignItems: "end",
        }}>
          <Field
            label="Account Balance (Rs.)"
            value={accountBalance}
            onChange={setAccountBalance}
          />

          <Field
            label="Actual Counted Balance (Rs.)"
            value={actualBalance}
            onChange={setActualBalance}
          />

          <button
            style={primaryButton}
            onClick={saveBalances}
            disabled={saving}
          >
            <Save size={14} /> Save Balances
          </button>
        </div>

        <p style={{
          color: "var(--text-muted)",
          fontSize: 11,
          margin: "12px 0 0",
        }}>
          Account Balance Should Be = Total Expense + Remaining Balance.
        </p>
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
        gap: 12,
        marginBottom: 18,
      }}>
        <Metric label="Total Profit 1 · Website Sales" value={totals.profit1} />
        <Metric label="Total Profit 2 · Discount Sales" value={totals.profit2} />
        <Metric label="Sub Total Profit" value={totals.subProfit} />

        <Metric
          label="Actual Total Profit 1"
          value={totals.actualP1}
          color={totals.actualP1 >= 0 ? "#15803D" : "#DC2626"}
        />

        <Metric
          label="Actual Total Profit 2"
          value={totals.actualP2}
          color={totals.actualP2 >= 0 ? "#15803D" : "#DC2626"}
        />

        <Metric
          label="Sub Total Actual Profit"
          value={totals.actualProfit}
          color={totals.actualProfit >= 0 ? "#15803D" : "#DC2626"}
        />
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
        gap: 12,
        marginBottom: 20,
      }}>
        <Metric
          label="Ahmad Profit · 50%"
          value={totals.ahmadShare}
          detail={`Paid ${money(totals.paidAhmad)} · Remaining ${money(totals.remainingAhmad)}`}
        />

        <Metric
          label="Sidra Profit · 50%"
          value={totals.sidraShare}
          detail={`Paid ${money(totals.paidSidra)} · Remaining ${money(totals.remainingSidra)}`}
        />
      </section>

      <nav style={{
        display: "flex",
        gap: 6,
        borderBottom: "1px solid var(--border)",
        marginBottom: 15,
        flexWrap: "wrap",
      }}>
        {([
          ["sheet", "Expense Sheet"],
          ["profit", "Profit Summary"],
          ["payments", "Payments & Custom Columns"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              border: 0,
              borderBottom: tab === id
                ? "2px solid #173B67"
                : "2px solid transparent",
              background: "transparent",
              padding: "12px 14px",
              color: tab === id
                ? "var(--text-primary)"
                : "var(--text-muted)",
              fontSize: 12,
              fontWeight: tab === id ? 700 : 500,
              cursor: "pointer",
            }}
          >{label}</button>
        ))}
      </nav>

      {tab === "sheet" && (
        <section style={{
          ...cardStyle,
          padding: 0,
          overflow: "hidden",
        }}>
          <div style={{
            padding: 15,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 750,
                color: "var(--text-primary)",
              }}>Product & Expense Records</h2>

              <p style={{
                margin: "5px 0 0",
                fontSize: 11,
                color: "var(--text-muted)",
              }}>
                Website sales are imported from delivered orders automatically.
              </p>
            </div>

            <div style={{ position: "relative", width: 230, maxWidth: "100%" }}>
              <Search size={14} style={{
                position: "absolute",
                left: 10,
                top: 11,
                color: "var(--text-muted)",
              }} />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product or date..."
                style={{ ...inputStyle, paddingLeft: 31 }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{
              padding: 40,
              textAlign: "center",
              color: "var(--text-muted)",
            }}>
              <Loader2 size={22} /> Loading expense sheet...
            </div>
          ) : (
            <div style={{ overflowX: "auto", maxHeight: 650 }}>
              <table style={{
                width: "100%",
                minWidth: 1600,
                borderCollapse: "separate",
                borderSpacing: 0,
              }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                  <tr style={{ background: "#F1F5F9" }}>
                    {[
                      "Date", "Product", "Sale 1 Qty", "Actual Price",
                      "Website Price", "Sale 1 Total", "Actual Cost",
                      "Actual P1", "Discount Price", "Sale 2 Qty",
                      "Discount Total", "Actual P2", "Personal Expense",
                      "Business Expense", "Note", "Actions",
                    ].map((heading) => (
                      <th key={heading} style={{
                        padding: "12px 10px",
                        textAlign: "left",
                        color: "#334155",
                        fontSize: 10,
                        whiteSpace: "nowrap",
                        borderBottom: "1px solid #CBD5E1",
                      }}>{heading}</th>
                    ))}

                    {(data?.columns || []).map((column) => (
                      <th key={column.id} style={{
                        padding: "12px 10px",
                        textAlign: "left",
                        color: "#334155",
                        fontSize: 10,
                        whiteSpace: "nowrap",
                        borderBottom: "1px solid #CBD5E1",
                      }}>{column.name}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => {
                    const saleQty = row.sale?.quantity || 0;

                    const saleTotal = row.sale?.salesAmount ||
                      row.websitePrice * saleQty;

                    const actualCost = row.sale?.actualCost ||
                      row.actualPrice * saleQty;

                    const actualP1 = saleTotal - actualCost;

                    const discountTotal =
                      row.discountSalePrice * row.discountQuantity;

                    const actualP2 = discountTotal -
                      row.actualPrice * row.discountQuantity;

                    return (
                      <tr key={row.id}>
                        <td style={tableCell}>{row.date}</td>

                        <td style={{
                          ...tableCell,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}>
                          {row.productName || "General Expense"}
                        </td>

                        <td style={tableCell}>{saleQty}</td>
                        <td style={tableCell}>{money(row.actualPrice)}</td>
                        <td style={tableCell}>{money(row.websitePrice)}</td>
                        <td style={tableCell}>{money(saleTotal)}</td>
                        <td style={tableCell}>{money(actualCost)}</td>

                        <td style={{
                          ...tableCell,
                          fontWeight: 700,
                          color: actualP1 >= 0 ? "#15803D" : "#DC2626",
                        }}>{money(actualP1)}</td>

                        <td style={tableCell}>{money(row.discountSalePrice)}</td>
                        <td style={tableCell}>{row.discountQuantity}</td>
                        <td style={tableCell}>{money(discountTotal)}</td>

                        <td style={{
                          ...tableCell,
                          fontWeight: 700,
                          color: actualP2 >= 0 ? "#15803D" : "#DC2626",
                        }}>{money(actualP2)}</td>

                        <td style={tableCell}>{money(row.personalExpense)}</td>
                        <td style={tableCell}>{money(row.businessExpense)}</td>

                        <td style={{
                          ...tableCell,
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>{row.note || "—"}</td>

                        {/* Action buttons visibility fixed */}
                        <td style={tableCell}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                          }}>
                            <button
                              type="button"
                              title="Edit row"
                              aria-label="Edit row"
                              style={{
                                width: 34,
                                height: 34,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#EFF6FF",
                                color: "#1D4ED8",
                                border: "1px solid #BFDBFE",
                                borderRadius: 7,
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                              onClick={() => openEditRow(row)}
                            >
                              <Pencil size={16} />
                            </button>

                            {!row.id.startsWith("auto-") && (
                              <button
                                type="button"
                                title="Delete row"
                                aria-label="Delete row"
                                style={{
                                  width: 34,
                                  height: 34,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "#FEF2F2",
                                  color: "#DC2626",
                                  border: "1px solid #FECACA",
                                  borderRadius: 7,
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                                onClick={() => deleteRow(row.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>

                        {(data?.columns || []).map((column) => (
                          <td key={column.id} style={tableCell}>
                            {String(row.customValues?.[column.id] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={16 + (data?.columns.length || 0)}
                        style={{
                          ...tableCell,
                          padding: 35,
                          textAlign: "center",
                        }}
                      >
                        No records found for this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div style={{
            padding: 12,
            borderTop: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontSize: 11,
          }}>
            Sale 1 = delivered website order quantity. Sale 2 = manually entered discount quantity.
          </div>
        </section>
      )}

      {tab === "profit" && (
        <section style={cardStyle}>
          <h2 style={{
            fontSize: 15,
            margin: "0 0 15px",
            color: "var(--text-primary)",
          }}>Profit & Expense Breakdown</h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
          }}>
            {[
              ["Personal Expense", totals.personal],
              ["Business Expense", totals.business],
              ["Total Expense", totals.totalExpense],
              ["Total Profit 1", totals.profit1],
              ["Total Profit 2", totals.profit2],
              ["Sub Total Profit", totals.subProfit],
              ["Actual Total P1", totals.actualP1],
              ["Actual Total P2", totals.actualP2],
              ["Sub Total Actual Profit", totals.actualProfit],
              ["Ahmad 50% Profit", totals.ahmadShare],
              ["Sidra 50% Profit", totals.sidraShare],
            ].map(([label, value]) => (
              <div key={String(label)} style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 14,
              }}>
                <div style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  marginBottom: 8,
                }}>{label}</div>

                <strong style={{
                  fontSize: 17,
                  color: "var(--text-primary)",
                }}>{money(Number(value))}</strong>
              </div>
            ))}
          </div>

          <p style={{
            fontSize: 11,
            color: "var(--text-muted)",
            margin: "16px 0 0",
          }}>
            Actual P1 = website sale amount minus saved order-item actual cost.
            Actual P2 = discount sale amount minus product cost × discount quantity.
          </p>
        </section>
      )}

      {tab === "payments" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 14,
        }}>
          <section style={cardStyle}>
            <h2 style={{
              fontSize: 15,
              margin: "0 0 15px",
              color: "var(--text-primary)",
            }}>Add Profit Payment</h2>

            <form onSubmit={addPayment} style={{ display: "grid", gap: 12 }}>
              <label style={{
                fontSize: 11,
                color: "var(--text-secondary)",
              }}>
                Person

                <select
                  value={paymentPerson}
                  onChange={(e) => setPaymentPerson(e.target.value)}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  <option value="Ahmad">Ahmad</option>
                  <option value="Sidra">Sidra</option>
                </select>
              </label>

              <Field
                label="Payment Amount (Rs.)"
                value={paymentAmount}
                onChange={setPaymentAmount}
              />

              <Field
                label="Payment Date"
                type="date"
                value={paymentDate}
                onChange={setPaymentDate}
              />

              <Field
                label="Note"
                type="text"
                value={paymentNote}
                onChange={setPaymentNote}
                placeholder="Optional note"
              />

              <button type="submit" style={primaryButton} disabled={saving}>
                <Plus size={14} /> Save Payment
              </button>
            </form>

            <div style={{ marginTop: 18, display: "grid", gap: 9 }}>
              <Metric label="Ahmad Remaining" value={totals.remainingAhmad} />
              <Metric label="Sidra Remaining" value={totals.remainingSidra} />
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{
              fontSize: 15,
              margin: "0 0 15px",
              color: "var(--text-primary)",
            }}>Payment History</h2>

            {(data?.payments || []).length === 0 ? (
              <p style={{
                color: "var(--text-muted)",
                fontSize: 12,
              }}>
                No payments recorded in this date range.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {data?.payments.map((payment) => (
                  <div key={payment.id} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: 11,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}>
                    <div>
                      <strong style={{
                        fontSize: 12,
                        color: "var(--text-primary)",
                      }}>
                        {payment.person} · {money(payment.amount)}
                      </strong>

                      <div style={{
                        color: "var(--text-muted)",
                        fontSize: 10,
                        marginTop: 4,
                      }}>
                        {dateValue(payment.date)}
                        {payment.note ? ` · ${payment.note}` : ""}
                      </div>
                    </div>

                    <button
                      style={{ ...buttonStyle, color: "#DC2626" }}
                      onClick={() => deletePayment(payment.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{
            ...cardStyle,
            gridColumn: "1 / -1",
          }}>
            <h2 style={{
              fontSize: 15,
              margin: "0 0 13px",
              color: "var(--text-primary)",
            }}>Add Custom Column</h2>

            <form
              onSubmit={addColumn}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: 10,
                alignItems: "end",
              }}
            >
              <Field
                label="Column Name"
                type="text"
                value={columnName}
                onChange={setColumnName}
                placeholder="e.g. Supplier"
              />

              <label style={{
                fontSize: 11,
                color: "var(--text-secondary)",
              }}>
                Column Type

                <select
                  value={columnKind}
                  onChange={(e) => setColumnKind(e.target.value)}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                </select>
              </label>

              <button type="submit" style={primaryButton}>
                <Plus size={14} /> Add Column
              </button>
            </form>

            <p style={{
              color: "var(--text-muted)",
              fontSize: 11,
              marginTop: 10,
            }}>
              Custom columns are saved for the sheet. Core profit and balance columns are formula-calculated automatically.
            </p>

            {(data?.columns || []).length > 0 && (
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 7,
                marginTop: 12,
              }}>
                {data?.columns.map((column) => (
                  <span key={column.id} style={{
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "6px 10px",
                    fontSize: 11,
                    color: "var(--text-secondary)",
                  }}>
                    {column.name} · {column.kind}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {showRowForm && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowRowForm(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15,23,42,.78)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            overflowY: "auto",
          }}
        >
          <section style={{
            width: "min(850px,100%)",
            maxHeight: "min(90vh,850px)",
            overflowY: "auto",
            overflowX: "visible",
            background: "#FFFFFF",
            color: "#0F172A",
            border: "1px solid #CBD5E1",
            borderRadius: 15,
            padding: 22,
            boxShadow: "0 25px 80px rgba(0,0,0,.38)",
            position: "relative",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              paddingBottom: 15,
              borderBottom: "1px solid #E2E8F0",
            }}>
              <div>
                <h2 style={{
                  fontSize: 19,
                  fontWeight: 750,
                  margin: 0,
                  color: "#0F172A",
                }}>
                  {editingId ? "Edit Expense Row" : "Add Expense Row"}
                </h2>

                <p style={{
                  fontSize: 12,
                  color: "#64748B",
                  margin: "6px 0 0",
                }}>
                  Select a product or add a general expense.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                style={{
                  ...buttonStyle,
                  width: 38,
                  height: 38,
                  padding: 0,
                  background: "#F1F5F9",
                  color: "#334155",
                  borderColor: "#CBD5E1",
                  flexShrink: 0,
                }}
                onClick={() => setShowRowForm(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveRow}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
                gap: 15,
                alignItems: "start",
              }}>
                <Field
                  label="Date"
                  type="date"
                  value={form.date}
                  onChange={(v) =>
                    setForm((old) => ({ ...old, date: v }))
                  }
                />

                <ProductSearchSelect
                  products={data?.products || []}
                  value={form.productId}
                  onChange={selectProduct}
                />

                <Field
                  label="Actual Purchase Price (Rs.)"
                  value={form.actualPrice}
                  onChange={(v) =>
                    setForm((old) => ({ ...old, actualPrice: v }))
                  }
                />

                <Field
                  label="Website Sale Price (Rs.)"
                  value={form.websitePrice}
                  onChange={(v) =>
                    setForm((old) => ({ ...old, websitePrice: v }))
                  }
                />

                <Field
                  label="Discount Sale Price (Rs.)"
                  value={form.discountSalePrice}
                  onChange={(v) =>
                    setForm((old) => ({ ...old, discountSalePrice: v }))
                  }
                />

                <Field
                  label="Sale 2 Quantity"
                  value={form.discountQuantity}
                  onChange={(v) =>
                    setForm((old) => ({ ...old, discountQuantity: v }))
                  }
                />

                <Field
                  label="Personal Expense (Rs.)"
                  value={form.personalExpense}
                  onChange={(v) =>
                    setForm((old) => ({ ...old, personalExpense: v }))
                  }
                />

                <Field
                  label="Business Expense (Rs.)"
                  value={form.businessExpense}
                  onChange={(v) =>
                    setForm((old) => ({ ...old, businessExpense: v }))
                  }
                />
              </div>

              <label style={{
                display: "block",
                fontSize: 11,
                fontWeight: 650,
                color: "#475569",
                marginTop: 16,
              }}>
                Note

                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) =>
                    setForm((old) => ({ ...old, note: e.target.value }))
                  }
                  placeholder="Write any additional details..."
                  style={{
                    ...inputStyle,
                    marginTop: 6,
                    resize: "vertical",
                    display: "block",
                  }}
                />
              </label>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 9,
                marginTop: 21,
                paddingTop: 15,
                borderTop: "1px solid #E2E8F0",
                flexWrap: "wrap",
              }}>
                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: "#FFFFFF",
                    color: "#334155",
                    borderColor: "#CBD5E1",
                    padding: "10px 17px",
                  }}
                  onClick={() => setShowRowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    ...primaryButton,
                    padding: "10px 19px",
                    minWidth: 125,
                  }}
                  disabled={saving}
                >
                  {saving
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Save size={15} />
                  }
                  {editingId ? "Update Row" : "Save Row"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {loading && (
        <div style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "9px 12px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          fontSize: 11,
          color: "var(--text-secondary)",
          zIndex: 20,
        }}>
          <Loader2 size={14} /> Updating sheet...
        </div>
      )}
    </main>
  );
}
