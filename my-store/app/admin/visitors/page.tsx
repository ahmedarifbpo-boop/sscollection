"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckSquare, Square } from "lucide-react";

interface Visitor {
  id: string;
  ip: string;
  page: string;
  createdAt: string;
}

export default function AdminVisitorsPage() {
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const admin = localStorage.getItem("ss-admin");
    if (!admin) { router.push("/admin/login"); return; }
    
    fetch("/api/admin/visitors")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        return data;
      })
      .then(data => {
        setVisitors(data.visitors || []);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg(err.message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === visitors.length) setSelected([]);
    else setSelected(visitors.map(v => v.id));
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} selected records?`)) return;
    try {
      await fetch("/api/admin/visitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      setVisitors(prev => prev.filter(v => !selected.includes(v.id)));
      setSelected([]);
    } catch (e) {
      alert("Failed to delete");
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div style={{ padding: "60px", textAlign: "center" }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)" }}>Visitor Tracking</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>IP, Page, Date and Time logs</p>
        </div>
        <button onClick={handleDelete} disabled={selected.length === 0} className="dz-btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px", color: selected.length > 0 ? "#EF4444" : "var(--text-muted)", borderColor: selected.length > 0 ? "#EF4444" : "var(--border)" }}>
          <Trash2 size={16} /> Delete Selected ({selected.length})
        </button>
      </div>

      {/* ERROR MESSAGE YAHAN SHOW HOGA */}
      {errorMsg && (
        <div style={{ background: "#FEE", color: "#EF4444", padding: "16px", borderRadius: "3px", marginBottom: "16px" }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <div className="dz-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead style={{ background: "var(--bg-alt)", borderBottom: "1px solid var(--border)" }}>
            <tr>
              <th style={{ padding: "12px", width: "40px" }}>
                <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                  {visitors.length > 0 && selected.length === visitors.length ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
              </th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "var(--text-muted)" }}>IP Address</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "var(--text-muted)" }}>Page / Link</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "var(--text-muted)" }}>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>No visitors tracked yet.</td>
              </tr>
            ) : (
              visitors.map(v => (
                <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button onClick={() => toggleSelect(v.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                      {selected.includes(v.id) ? <CheckSquare size={18} style={{ color: "var(--accent)" }} /> : <Square size={18} style={{ color: "var(--text-muted)" }} />}
                    </button>
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-primary)" }}>{v.ip}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>{v.page}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{formatDate(v.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}