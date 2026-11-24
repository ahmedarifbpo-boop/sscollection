
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, RefreshCw, Search, Pencil, Trash2, X, Wallet,
  Save, Loader2, ChevronDown, Check, TrendingUp,
  Fuel, Truck, CalendarDays, Receipt, BarChart3,
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
  fuelCharges: number;
  deliveryCharges: number;
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

const colors = {
  navy: "#173B67",
  navyDark: "#102B4D",
  blue: "#2563EB",
  green: "#15803D",
  red: "#DC2626",
  orange: "#D97706",
  text: "#172B45",
  muted: "#718096",
  border: "#E2E8F0",
  surface: "#FFFFFF",
  background: "#F4F7FB",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: `1px solid ${colors.border}`,
  borderRadius: 9,
  padding: "11px 12px",
  background: "#FFFFFF",
  color: colors.text,
  fontSize: 13,
  outline: "none",
  minHeight: 41,
};

const cardStyle: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 13,
  padding: 18,
  minWidth: 0,
  boxShadow: "0 2px 8px rgba(15, 35, 60, .035)",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: `1px solid ${colors.border}`,
  borderRadius: 9,
  padding: "10px 14px",
  background: "#FFFFFF",
  color: "#334155",
  fontSize: 12,
  fontWeight: 650,
  cursor: "pointer",
  minHeight: 39,
  flexShrink: 0,
  transition: "all .15s ease",
};

const primaryButton: React.CSSProperties = {
  ...buttonStyle,
  background: colors.navy,
  color: "#FFFFFF",
  borderColor: colors.navy,
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
        fontWeight: 700,
        color: "#52647A",
        marginBottom: 7,
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

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 11,
      marginBottom: 17,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        display: "grid",
        placeItems: "center",
        background: "#EDF3FA",
        color: colors.navy,
        flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{
          fontSize: 14,
          fontWeight: 750,
          color: colors.text,
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontSize: 11,
            color: colors.muted,
            marginTop: 3,
          }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  color,
  icon,
  accent,
}: {
  label: string;
  value: number;
  detail?: string;
  color?: string;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div style={{
      ...cardStyle,
      padding: 16,
      position: "relative",
      overflow: "hidden",
      borderTop: `3px solid ${accent || "#DCE6F1"}`,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        marginBottom: 13,
      }}>
        <div style={{
          color: colors.muted,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1.5,
        }}>{label}</div>
        {icon && (
          <div style={{
            width: 31,
            height: 31,
            borderRadius: 9,
            display: "grid",
            placeItems: "center",
            background: `${accent || colors.navy}14`,
            color: accent || colors.navy,
            flexShrink: 0,
          }}>{icon}</div>
        )}
      </div>
      <div style={{
        color: color || colors.text,
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: "-.45px",
        overflowWrap: "anywhere",
      }}>{money(value)}</div>
      {detail && (
        <div style={{
          color: colors.muted,
          fontSize: 10,
          marginTop: 8,
          lineHeight: 1.5,
        }}>{detail}</div>
      )}
    </div>
  );
}

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
        fontWeight: 700,
        color: "#52647A",
        marginBottom: 7,
      }}>Product</label>

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
            paddingRight: 40,
            cursor: "text",
          }}
        />

        <button
          type="button"
          onClick={() => open ? setOpen(false) : openDropdown()}
          aria-label="Toggle product list"
          style={{
            position: "absolute",
            right: 6,
            top: 6,
            width: 29,
            height: 29,
            display: "grid",
            placeItems: "center",
            border: 0,
            borderRadius: 7,
            background: "#EDF2F8",
            color: colors.navy,
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
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          boxShadow: "0 14px 35px rgba(15,23,42,.18)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: 9,
            borderBottom: `1px solid ${colors.border}`,
            background: "#F8FAFC",
          }}>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{
                position: "absolute",
                left: 10,
                top: 11,
                color: "#64748B",
              }} />
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
                borderRadius: 7,
                background: value === "" ? "#EFF6FF" : "#FFFFFF",
                color: colors.text,
                textAlign: "left",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <span>General Expense / No Product</span>
              {value === "" && <Check size={15} color={colors.blue} />}
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
                  borderRadius: 7,
                  background: value === product.id ? "#EFF6FF" : "#FFFFFF",
                  color: colors.text,
                  textAlign: "left",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  {product.name}
                </span>
                {value === product.id && <Check size={15} color={colors.blue} />}
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
            borderTop: `1px solid ${colors.border}`,
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
    fuelCharges: "0",
    deliveryCharges: "0",
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

      return {
        ...row,
        date,
        sale,
        fuelCharges: numberValue(row.fuelCharges),
        deliveryCharges: numberValue(row.deliveryCharges),
      };
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
          fuelCharges: 0,
          deliveryCharges: 0,
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

    const personal = rows.reduce((sum, row) => sum + numberValue(row.personalExpense), 0);
    const business = rows.reduce((sum, row) => sum + numberValue(row.businessExpense), 0);
    const fuel = rows.reduce((sum, row) => sum + numberValue(row.fuelCharges), 0);
    const delivery = rows.reduce((sum, row) => sum + numberValue(row.deliveryCharges), 0);

    const totalExpense = personal + business + fuel + delivery;

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

    // Existing calculation: personal/business expenses are not deducted here.
    const grossActualProfit = actualP1 + actualP2;
    const actualProfit = grossActualProfit - fuel - delivery;

    const ahmadShare = actualProfit / 2;
    const sidraShare = actualProfit / 2;

    const paidAhmad = (data?.payments || [])
      .filter((p) => p.person === "Ahmad")
      .reduce((sum, p) => sum + p.amount, 0);

    const paidSidra = (data?.payments || [])
      .filter((p) => p.person === "Sidra")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      personal,
      business,
      fuel,
      delivery,
      totalExpense,
      balance,
      counted,
      remaining,
      expected,
      difference: expected - counted,
      profit1,
      profit2,
      subProfit: profit1 + profit2,
      actualP1,
      actualP2,
      grossActualProfit,
      actualProfit,
      ahmadShare,
      sidraShare,
      paidAhmad,
      paidSidra,
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
      fuelCharges: "0",
      deliveryCharges: "0",
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
      fuelCharges: String(row.fuelCharges),
      deliveryCharges: String(row.deliveryCharges),
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
        fuelCharges: numberValue(form.fuelCharges),
        deliveryCharges: numberValue(form.deliveryCharges),
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
    padding: "13px 12px",
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 12,
    whiteSpace: "nowrap",
    color: "#52647A",
    background: "#FFFFFF",
  };

  const tabs = [
    { id: "sheet", label: "Expense Sheet", icon: <Receipt size={15} /> },
    { id: "profit", label: "Profit Summary", icon: <BarChart3 size={15} /> },
    { id: "payments", label: "Payments & Custom Columns", icon: <Wallet size={15} /> },
  ] as const;

  return (
    <main style={{
      maxWidth: 1600,
      margin: "0 auto",
      padding: "8px 0 40px",
      color: colors.text,
    }}>
      <style>{`
        .expense-page button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }
        .expense-page input:focus,
        .expense-page textarea:focus,
        .expense-page select:focus {
          border-color: #6B91BD !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,.09);
        }
        .expense-page button:not(:disabled):hover {
          filter: brightness(.97);
        }
        .expense-table tbody tr:hover td {
          background: #F8FAFD !important;
        }
        .expense-tab {
          white-space: nowrap;
        }
        @media(max-width:640px) {
          .expense-page {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .expense-header {
            align-items: flex-start !important;
          }
          .expense-header h1 {
            font-size: 22px !important;
          }
          .expense-tabs {
            overflow-x: auto;
            flex-wrap: nowrap !important;
          }
          .expense-tab {
            padding: 12px 10px !important;
            font-size: 11px !important;
          }
          .expense-modal {
            padding: 15px !important;
            border-radius: 12px !important;
          }
        }
      `}</style>

      <div className="expense-page">
        {/* HEADER */}
        <header className="expense-header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 15,
          marginBottom: 23,
          padding: "20px 21px",
          borderRadius: 15,
          background: `linear-gradient(115deg, ${colors.navyDark}, ${colors.navy} 70%, #285887)`,
          color: "#FFFFFF",
          boxShadow: "0 8px 22px rgba(23,59,103,.15)",
        }}>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 7,
            }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(255,255,255,.14)",
                display: "grid",
                placeItems: "center",
              }}>
                <Wallet size={19} />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "1.5px",
                color: "#C5D7EA",
              }}>S.S COLLECTION · FINANCE</span>
            </div>
            <h1 style={{
              fontSize: 27,
              fontWeight: 800,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-.7px",
            }}>Expense Sheet</h1>
            <p style={{
              fontSize: 12,
              color: "#D5E2F0",
              margin: "6px 0 0",
            }}>Business accounts, expenses and profit management</p>
          </div>

          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button
              style={{
                ...buttonStyle,
                background: "rgba(255,255,255,.12)",
                borderColor: "rgba(255,255,255,.25)",
                color: "#FFFFFF",
              }}
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw size={14} /> Refresh
            </button>

            <button
              style={{
                ...buttonStyle,
                background: "#FFFFFF",
                borderColor: "#FFFFFF",
                color: colors.navy,
                fontWeight: 750,
              }}
              onClick={openNewRow}
            >
              <Plus size={15} /> Add New Record
            </button>
          </div>
        </header>

        {/* ALERTS */}
        {error && (
          <div style={{
            background: "#FEF2F2",
            color: "#991B1B",
            border: "1px solid #FECACA",
            padding: "12px 14px",
            borderRadius: 10,
            marginBottom: 14,
            fontSize: 12,
            fontWeight: 600,
          }}>{error}</div>
        )}

        {success && (
          <div style={{
            background: "#F0FDF4",
            color: "#166534",
            border: "1px solid #BBF7D0",
            padding: "12px 14px",
            borderRadius: 10,
            marginBottom: 14,
            fontSize: 12,
            fontWeight: 600,
          }}>{success}</div>
        )}

        {/* DATE FILTER */}
        <section style={{
          ...cardStyle,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 14,
          alignItems: "end",
          marginBottom: 19,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            gridColumn: "1 / -1",
            color: colors.text,
            fontSize: 12,
            fontWeight: 750,
          }}>
            <CalendarDays size={16} color={colors.navy} />
            Report Period
          </div>

          <Field label="From Date" type="date" value={from} onChange={setFrom} />
          <Field label="To Date" type="date" value={to} onChange={setTo} />

          <div style={{
            alignSelf: "end",
            paddingBottom: 10,
            fontSize: 11,
            color: colors.muted,
          }}>
            All dates use Pakistan time (UTC+5).
          </div>
        </section>

        {/* ACCOUNT DASHBOARD */}
        <div style={{ marginBottom: 11 }}>
          <SectionTitle
            icon={<Wallet size={18} />}
            title="Account Overview"
            subtitle="Current balance and expense position"
          />
        </div>

        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: 12,
          marginBottom: 19,
        }}>
          <Metric
            label="Account Balance"
            value={totals.balance}
            accent={colors.navy}
            icon={<Wallet size={16} />}
          />
          <Metric
            label="Total Expense"
            value={totals.totalExpense}
            color={colors.orange}
            accent={colors.orange}
            icon={<Receipt size={16} />}
            detail={`Personal ${money(totals.personal)} · Business ${money(totals.business)}`}
          />
          <Metric
            label="Fuel Charges"
            value={totals.fuel}
            color={colors.orange}
            accent="#F59E0B"
            icon={<Fuel size={16} />}
          />
          <Metric
            label="Delivery Charges"
            value={totals.delivery}
            color={colors.blue}
            accent={colors.blue}
            icon={<Truck size={16} />}
          />
          <Metric
            label="Remaining Balance"
            value={totals.remaining}
            color={totals.remaining >= 0 ? colors.green : colors.red}
            accent={colors.green}
          />
          <Metric
            label="Actual Counted Balance"
            value={totals.counted}
            accent="#64748B"
          />
          <Metric
            label="Account Difference"
            value={totals.difference}
            color={Math.abs(totals.difference) < 0.01 ? colors.green : colors.red}
            accent={Math.abs(totals.difference) < 0.01 ? colors.green : colors.red}
            detail="Expected balance minus counted balance"
          />
        </section>

        {/* ACCOUNT SETTINGS */}
        <section style={{ ...cardStyle, marginBottom: 23 }}>
          <SectionTitle
            icon={<Wallet size={18} />}
            title="Account Balance Settings"
            subtitle="Update your account and actual counted balance"
          />

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
            gap: 13,
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
              style={{ ...primaryButton, minHeight: 42 }}
              onClick={saveBalances}
              disabled={saving}
            >
              {saving ? <Loader2 size={14} /> : <Save size={14} />}
              Save Balance Settings
            </button>
          </div>

          <div style={{
            marginTop: 13,
            padding: "10px 12px",
            borderRadius: 8,
            background: "#F3F7FC",
            color: "#53677E",
            fontSize: 11,
          }}>
            Account Balance Should Be = Total Expense + Remaining Balance.
          </div>
        </section>

        {/* PROFIT DASHBOARD */}
        <div style={{ marginBottom: 11 }}>
          <SectionTitle
            icon={<TrendingUp size={18} />}
            title="Profit Overview"
            subtitle="Website sales, discount sales and actual profit"
          />
        </div>

        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: 12,
          marginBottom: 18,
        }}>
          <Metric label="Total Profit 1 · Website Sales" value={totals.profit1} accent={colors.blue} />
          <Metric label="Total Profit 2 · Discount Sales" value={totals.profit2} accent="#8B5CF6" />
          <Metric label="Sub Total Profit" value={totals.subProfit} accent={colors.navy} />
          <Metric
            label="Actual Total Profit 1"
            value={totals.actualP1}
            color={totals.actualP1 >= 0 ? colors.green : colors.red}
            accent={colors.green}
          />
          <Metric
            label="Actual Total Profit 2"
            value={totals.actualP2}
            color={totals.actualP2 >= 0 ? colors.green : colors.red}
            accent="#16A34A"
          />
          <Metric
            label="Gross Actual Profit"
            value={totals.grossActualProfit}
            color={totals.grossActualProfit >= 0 ? colors.green : colors.red}
            accent="#0D9488"
            detail="Actual P1 + Actual P2"
          />
          <Metric
            label="Actual Total Profit"
            value={totals.actualProfit}
            color={totals.actualProfit >= 0 ? colors.green : colors.red}
            accent={colors.navy}
            detail={`Gross profit − Fuel ${money(totals.fuel)} − Delivery ${money(totals.delivery)}`}
          />
        </section>

        {/* PROFIT DISTRIBUTION */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
          gap: 12,
          marginBottom: 23,
        }}>
          <div style={{
            ...cardStyle,
            borderLeft: "4px solid #2563EB",
            background: "linear-gradient(120deg,#FFFFFF,#F3F7FF)",
          }}>
            <div style={{
              fontSize: 11,
              color: colors.muted,
              fontWeight: 700,
              marginBottom: 9,
            }}>AHMAD · 50% PROFIT SHARE</div>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: colors.navy,
            }}>{money(totals.ahmadShare)}</div>
            <div style={{
              display: "flex",
              gap: 15,
              flexWrap: "wrap",
              marginTop: 12,
              fontSize: 11,
              color: colors.muted,
            }}>
              <span>Paid: <strong style={{ color: colors.text }}>{money(totals.paidAhmad)}</strong></span>
              <span>Remaining: <strong style={{ color: colors.green }}>{money(totals.remainingAhmad)}</strong></span>
            </div>
          </div>

          <div style={{
            ...cardStyle,
            borderLeft: "4px solid #0D9488",
            background: "linear-gradient(120deg,#FFFFFF,#F0FDFA)",
          }}>
            <div style={{
              fontSize: 11,
              color: colors.muted,
              fontWeight: 700,
              marginBottom: 9,
            }}>SIDRA · 50% PROFIT SHARE</div>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0F766E",
            }}>{money(totals.sidraShare)}</div>
            <div style={{
              display: "flex",
              gap: 15,
              flexWrap: "wrap",
              marginTop: 12,
              fontSize: 11,
              color: colors.muted,
            }}>
              <span>Paid: <strong style={{ color: colors.text }}>{money(totals.paidSidra)}</strong></span>
              <span>Remaining: <strong style={{ color: colors.green }}>{money(totals.remainingSidra)}</strong></span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <nav className="expense-tabs" style={{
          display: "flex",
          gap: 5,
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: 17,
          flexWrap: "wrap",
        }}>
          {tabs.map((item) => (
            <button
              key={item.id}
              className="expense-tab"
              onClick={() => setTab(item.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                border: 0,
                borderBottom: tab === item.id
                  ? `3px solid ${colors.navy}`
                  : "3px solid transparent",
                borderRadius: "8px 8px 0 0",
                background: tab === item.id ? "#EDF3FA" : "transparent",
                padding: "13px 16px",
                color: tab === item.id ? colors.navy : colors.muted,
                fontSize: 12,
                fontWeight: tab === item.id ? 750 : 600,
                cursor: "pointer",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* EXPENSE SHEET */}
        {tab === "sheet" && (
          <section style={{
            ...cardStyle,
            padding: 0,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "17px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 13,
              flexWrap: "wrap",
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 800,
                  color: colors.text,
                }}>Product & Expense Records</h2>
                <p style={{
                  margin: "5px 0 0",
                  fontSize: 11,
                  color: colors.muted,
                }}>
                  Website sales are imported from delivered orders automatically.
                </p>
              </div>

              <div style={{ position: "relative", width: 250, maxWidth: "100%" }}>
                <Search size={15} style={{
                  position: "absolute",
                  left: 11,
                  top: 13,
                  color: colors.muted,
                }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product, note or date..."
                  style={{ ...inputStyle, paddingLeft: 34 }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{
                padding: 45,
                textAlign: "center",
                color: colors.muted,
                fontSize: 12,
              }}>
                <Loader2 size={23} /> 
                <div style={{ marginTop: 9 }}>Loading expense sheet...</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto", maxHeight: 650 }}>
                <table className="expense-table" style={{
                  width: "100%",
                  minWidth: 1900,
                  borderCollapse: "separate",
                  borderSpacing: 0,
                }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr style={{ background: "#EDF2F8" }}>
                      {[
                        "Date", "Product", "Sale 1 Qty", "Actual Price",
                        "Website Price", "Sale 1 Total", "Actual Cost",
                        "Actual P1", "Discount Price", "Sale 2 Qty",
                        "Discount Total", "Actual P2", "Personal Expense",
                        "Business Expense", "Fuel Charges", "Delivery Charges",
                        "Note", "Actions",
                      ].map((heading) => (
                        <th key={heading} style={{
                          padding: "13px 12px",
                          textAlign: "left",
                          color: "#344B66",
                          fontSize: 10,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                          borderBottom: `1px solid ${colors.border}`,
                          background: "#EDF2F8",
                        }}>{heading}</th>
                      ))}

                      {(data?.columns || []).map((column) => (
                        <th key={column.id} style={{
                          padding: "13px 12px",
                          textAlign: "left",
                          color: "#344B66",
                          fontSize: 10,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                          borderBottom: `1px solid ${colors.border}`,
                          background: "#EDF2F8",
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
                            fontWeight: 750,
                            color: colors.text,
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {row.productName || "General Expense"}
                          </td>

                          <td style={tableCell}>{saleQty}</td>
                          <td style={tableCell}>{money(row.actualPrice)}</td>
                          <td style={tableCell}>{money(row.websitePrice)}</td>
                          <td style={{ ...tableCell, fontWeight: 650 }}>{money(saleTotal)}</td>
                          <td style={tableCell}>{money(actualCost)}</td>

                          <td style={{
                            ...tableCell,
                            fontWeight: 750,
                            color: actualP1 >= 0 ? colors.green : colors.red,
                          }}>{money(actualP1)}</td>

                          <td style={tableCell}>{money(row.discountSalePrice)}</td>
                          <td style={tableCell}>{row.discountQuantity}</td>
                          <td style={tableCell}>{money(discountTotal)}</td>

                          <td style={{
                            ...tableCell,
                            fontWeight: 750,
                            color: actualP2 >= 0 ? colors.green : colors.red,
                          }}>{money(actualP2)}</td>

                          <td style={tableCell}>{money(row.personalExpense)}</td>
                          <td style={tableCell}>{money(row.businessExpense)}</td>

                          <td style={{
                            ...tableCell,
                            color: row.fuelCharges > 0 ? colors.orange : "#52647A",
                            fontWeight: row.fuelCharges > 0 ? 750 : 400,
                          }}>{money(row.fuelCharges)}</td>

                          <td style={{
                            ...tableCell,
                            color: row.deliveryCharges > 0 ? colors.blue : "#52647A",
                            fontWeight: row.deliveryCharges > 0 ? 750 : 400,
                          }}>{money(row.deliveryCharges)}</td>

                          <td style={{
                            ...tableCell,
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>{row.note || "—"}</td>

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
                                  width: 33,
                                  height: 33,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "#EFF6FF",
                                  color: "#1D4ED8",
                                  border: "1px solid #BFDBFE",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                                onClick={() => openEditRow(row)}
                              >
                                <Pencil size={15} />
                              </button>

                              {!row.id.startsWith("auto-") && (
                                <button
                                  type="button"
                                  title="Delete row"
                                  aria-label="Delete row"
                                  style={{
                                    width: 33,
                                    height: 33,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "#FEF2F2",
                                    color: "#DC2626",
                                    border: "1px solid #FECACA",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    flexShrink: 0,
                                  }}
                                  onClick={() => deleteRow(row.id)}
                                >
                                  <Trash2 size={15} />
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
                          colSpan={18 + (data?.columns.length || 0)}
                          style={{
                            ...tableCell,
                            padding: 45,
                            textAlign: "center",
                            color: colors.muted,
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
              padding: "12px 17px",
              borderTop: `1px solid ${colors.border}`,
              color: colors.muted,
              fontSize: 11,
              background: "#FAFCFE",
            }}>
              Sale 1 = delivered website order quantity. Sale 2 = manually entered discount quantity.
            </div>
          </section>
        )}

        {/* PROFIT SUMMARY */}
        {tab === "profit" && (
          <section style={cardStyle}>
            <SectionTitle
              icon={<BarChart3 size={18} />}
              title="Profit & Expense Breakdown"
              subtitle="Detailed financial summary for the selected date range"
            />

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
              gap: 12,
            }}>
              {[
                ["Personal Expense", totals.personal],
                ["Business Expense", totals.business],
                ["Fuel Charges", totals.fuel],
                ["Delivery Charges", totals.delivery],
                ["Total Expense", totals.totalExpense],
                ["Total Profit 1", totals.profit1],
                ["Total Profit 2", totals.profit2],
                ["Sub Total Profit", totals.subProfit],
                ["Actual Total P1", totals.actualP1],
                ["Actual Total P2", totals.actualP2],
                ["Gross Actual Profit", totals.grossActualProfit],
                ["Actual Profit After Fuel & Delivery", totals.actualProfit],
                ["Ahmad 50% Profit", totals.ahmadShare],
                ["Sidra 50% Profit", totals.sidraShare],
              ].map(([label, value]) => (
                <div key={String(label)} style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  padding: 15,
                  background: "#FFFFFF",
                }}>
                  <div style={{
                    color: colors.muted,
                    fontSize: 11,
                    fontWeight: 650,
                    marginBottom: 9,
                  }}>{label}</div>
                  <strong style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: colors.text,
                    overflowWrap: "anywhere",
                  }}>{money(Number(value))}</strong>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 18,
              padding: 15,
              borderRadius: 10,
              background: "#F3F7FC",
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 750,
                color: colors.navy,
                marginBottom: 10,
              }}>Calculation Details</div>
              <p style={{
                fontSize: 11,
                color: "#52647A",
                margin: "0 0 8px",
                lineHeight: 1.7,
              }}>
                Actual Profit = Actual P1 + Actual P2 − Fuel Charges − Delivery Charges
              </p>
              <p style={{
                fontSize: 11,
                color: "#52647A",
                margin: 0,
                lineHeight: 1.7,
              }}>
                Total Expense = Personal Expense + Business Expense + Fuel Charges + Delivery Charges
              </p>
            </div>
          </section>
        )}

        {/* PAYMENTS AND CUSTOM COLUMNS */}
        {tab === "payments" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
            gap: 15,
          }}>
            <section style={cardStyle}>
              <SectionTitle
                icon={<Wallet size={18} />}
                title="Add Profit Payment"
                subtitle="Record a payment against a person's profit share"
              />

              <form onSubmit={addPayment} style={{ display: "grid", gap: 13 }}>
                <label style={{
                  display: "block",
                  fontSize: 11,
                  color: "#52647A",
                  fontWeight: 700,
                }}>
                  Person
                  <select
                    value={paymentPerson}
                    onChange={(e) => setPaymentPerson(e.target.value)}
                    style={{ ...inputStyle, marginTop: 7 }}
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
                  {saving ? <Loader2 size={14} /> : <Plus size={14} />}
                  Save Payment
                </button>
              </form>

              <div style={{
                marginTop: 19,
                display: "grid",
                gap: 10,
              }}>
                <Metric
                  label="Ahmad Remaining"
                  value={totals.remainingAhmad}
                  accent={colors.blue}
                />
                <Metric
                  label="Sidra Remaining"
                  value={totals.remainingSidra}
                  accent="#0D9488"
                />
              </div>
            </section>

            <section style={cardStyle}>
              <SectionTitle
                icon={<Receipt size={18} />}
                title="Payment History"
                subtitle="Previously recorded profit payments"
              />

              {(data?.payments || []).length === 0 ? (
                <div style={{
                  padding: 28,
                  textAlign: "center",
                  background: "#F8FAFC",
                  borderRadius: 10,
                  color: colors.muted,
                  fontSize: 12,
                }}>
                  No payments recorded in this date range.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 9 }}>
                  {data?.payments.map((payment) => (
                    <div key={payment.id} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: 12,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                      background: "#FFFFFF",
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{
                          fontSize: 12,
                          color: colors.text,
                        }}>
                          {payment.person} · {money(payment.amount)}
                        </strong>
                        <div style={{
                          color: colors.muted,
                          fontSize: 10,
                          marginTop: 5,
                          overflowWrap: "anywhere",
                        }}>
                          {dateValue(payment.date)}
                          {payment.note ? ` · ${payment.note}` : ""}
                        </div>
                      </div>

                      <button
                        style={{
                          ...buttonStyle,
                          color: colors.red,
                          background: "#FEF2F2",
                          borderColor: "#FECACA",
                          width: 35,
                          minWidth: 35,
                          padding: 0,
                        }}
                        onClick={() => deletePayment(payment.id)}
                        aria-label="Delete payment"
                        title="Delete payment"
                      >
                        <Trash2 size={14} />
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
              <SectionTitle
                icon={<Plus size={18} />}
                title="Custom Columns"
                subtitle="Add extra information columns to your expense sheet"
              />

              <form
                onSubmit={addColumn}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 12,
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
                  display: "block",
                  fontSize: 11,
                  color: "#52647A",
                  fontWeight: 700,
                }}>
                  Column Type
                  <select
                    value={columnKind}
                    onChange={(e) => setColumnKind(e.target.value)}
                    style={{ ...inputStyle, marginTop: 7 }}
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
                color: colors.muted,
                fontSize: 11,
                marginTop: 13,
                lineHeight: 1.6,
              }}>
                Custom columns are saved for the sheet. Core profit and balance columns are formula-calculated automatically.
              </p>

              {(data?.columns || []).length > 0 && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 13,
                }}>
                  {data?.columns.map((column) => (
                    <span key={column.id} style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: 20,
                      padding: "7px 12px",
                      fontSize: 11,
                      fontWeight: 650,
                      color: "#52647A",
                      background: "#F8FAFC",
                    }}>
                      {column.name} · {column.kind}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ADD / EDIT ROW MODAL */}
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
              background: "rgba(10,25,45,.72)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              overflowY: "auto",
            }}
          >
            <section className="expense-modal" style={{
              width: "min(880px,100%)",
              maxHeight: "min(92vh,900px)",
              overflowY: "auto",
              overflowX: "visible",
              background: "#FFFFFF",
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: 23,
              boxShadow: "0 25px 80px rgba(0,0,0,.35)",
              position: "relative",
            }}>
              {/* MODAL HEADER */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 21,
                paddingBottom: 16,
                borderBottom: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <div style={{
                    width: 43,
                    height: 43,
                    borderRadius: 11,
                    background: "#EDF3FA",
                    color: colors.navy,
                    display: "grid",
                    placeItems: "center",
                  }}>
                    {editingId ? <Pencil size={19} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: 19,
                      fontWeight: 800,
                      margin: 0,
                      color: colors.text,
                    }}>
                      {editingId ? "Edit Expense Record" : "Add New Expense Record"}
                    </h2>
                    <p style={{
                      fontSize: 11,
                      color: colors.muted,
                      margin: "5px 0 0",
                    }}>
                      Enter product details, sales information and expenses.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  style={{
                    ...buttonStyle,
                    width: 37,
                    height: 37,
                    padding: 0,
                    background: "#F1F5F9",
                    color: "#475569",
                    flexShrink: 0,
                  }}
                  onClick={() => setShowRowForm(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveRow}>
                {/* PRODUCT DETAILS */}
                <div style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 11,
                  padding: 15,
                  marginBottom: 14,
                  background: "#FCFDFE",
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: colors.navy,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <span style={{
                      width: 23,
                      height: 23,
                      borderRadius: 7,
                      display: "grid",
                      placeItems: "center",
                      background: "#E8F0FA",
                    }}>1</span>
                    Product Details
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
                    gap: 14,
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
                  </div>
                </div>

                {/* SALES DETAILS */}
                <div style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 11,
                  padding: 15,
                  marginBottom: 14,
                  background: "#FCFDFE",
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: colors.navy,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <span style={{
                      width: 23,
                      height: 23,
                      borderRadius: 7,
                      display: "grid",
                      placeItems: "center",
                      background: "#E8F0FA",
                    }}>2</span>
                    Discount Sales Details
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
                    gap: 14,
                  }}>
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
                  </div>
                </div>

                {/* EXPENSE DETAILS */}
                <div style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 11,
                  padding: 15,
                  marginBottom: 14,
                  background: "#FCFDFE",
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: colors.navy,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <span style={{
                      width: 23,
                      height: 23,
                      borderRadius: 7,
                      display: "grid",
                      placeItems: "center",
                      background: "#E8F0FA",
                    }}>3</span>
                    Expense Details
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
                    gap: 14,
                  }}>
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

                    <Field
                      label="Fuel Charges (Rs.)"
                      value={form.fuelCharges}
                      onChange={(v) =>
                        setForm((old) => ({ ...old, fuelCharges: v }))
                      }
                      placeholder="Enter fuel charges"
                    />

                    <Field
                      label="Delivery Charges (Rs.)"
                      value={form.deliveryCharges}
                      onChange={(v) =>
                        setForm((old) => ({ ...old, deliveryCharges: v }))
                      }
                      placeholder="Enter delivery charges"
                    />
                  </div>
                </div>

                {/* NOTES */}
                <label style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#52647A",
                  marginTop: 15,
                }}>
                  Additional Note
                  <textarea
                    rows={3}
                    value={form.note}
                    onChange={(e) =>
                      setForm((old) => ({ ...old, note: e.target.value }))
                    }
                    placeholder="Write any additional details..."
                    style={{
                      ...inputStyle,
                      marginTop: 7,
                      resize: "vertical",
                      display: "block",
                      minHeight: 85,
                    }}
                  />
                </label>

                {/* MODAL FOOTER */}
                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 9,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: `1px solid ${colors.border}`,
                  flexWrap: "wrap",
                }}>
                  <button
                    type="button"
                    style={{
                      ...buttonStyle,
                      padding: "10px 18px",
                    }}
                    onClick={() => setShowRowForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      ...primaryButton,
                      padding: "10px 20px",
                      minWidth: 135,
                    }}
                    disabled={saving}
                  >
                    {saving
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Save size={15} />
                    }
                    {editingId ? "Update Record" : "Save Record"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            background: "#FFFFFF",
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: "10px 14px",
            display: "flex",
            gap: 9,
            alignItems: "center",
            fontSize: 11,
            fontWeight: 650,
            color: colors.navy,
            zIndex: 20,
            boxShadow: "0 5px 20px rgba(15,23,42,.1)",
          }}>
            <Loader2 size={15} className="animate-spin" />
            Updating expense sheet...
          </div>
        )}
      </div>
    </main>
  );
}
