"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export default function VerifyOrderPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) return;

    fetch(`/api/verify-order/${token}`)
      .then((res) => {
        if (res.ok) setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "20px" }}>
      <div className="dz-card" style={{ padding: "40px", textAlign: "center", maxWidth: "500px", width: "100%" }}>
        {status === "loading" && <h1>Verifying your order...</h1>}
        
        {status === "success" && (
          <>
            <CheckCircle2 size={64} style={{ color: "#10B981", margin: "0 auto 20px" }} />
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "10px" }}>Order Verified!</h1>
            <p style={{ color: "#666", marginBottom: "30px" }}>Your order has been confirmed. We will process it soon.</p>
            <Link href="/" className="dz-btn-primary" style={{ textDecoration: "none" }}>Go to Home</Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={64} style={{ color: "#EF4444", margin: "0 auto 20px" }} />
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "10px" }}>Invalid Link</h1>
            <p style={{ color: "#666", marginBottom: "30px" }}>This verification link is invalid or has expired.</p>
            <Link href="/" className="dz-btn-primary" style={{ textDecoration: "none" }}>Go to Home</Link>
          </>
        )}
      </div>
    </div>
  );
}