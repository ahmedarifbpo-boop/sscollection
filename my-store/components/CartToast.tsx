"use client";

import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";

export default function CartToast() {
  const { showToast, toastMessage } = useCart();

  if (!showToast) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "80px", // TopBar ke thoda neeche
        left: "50%",
        transform: "translateX(-50%)",
        background: "#10B981", // Green color
        color: "#fff",
        padding: "12px 24px",
        borderRadius: "30px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
        zIndex: 9999,
        animation: "slideDown 0.3s ease",
        fontWeight: "600",
        fontSize: "14px",
      }}
    >
      <CheckCircle2 size={20} />
      {toastMessage}

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}