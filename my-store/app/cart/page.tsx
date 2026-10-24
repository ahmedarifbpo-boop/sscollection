"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ShoppingCart, ArrowLeft, Minus, Plus, Trash2, CheckCircle2, X
} from "lucide-react";
import { useCart } from "@/lib/cart";

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();

  // Email add kiya gaya hai form mein
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderSnapshot, setOrderSnapshot] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  
  const [settings, setSettings] = useState({ shippingFee: 250, freeShippingThreshold: 5000, enableFreeShipping: true });

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          setSettings({
            shippingFee: d.settings.shippingFee || 250,
            freeShippingThreshold: d.settings.freeShippingThreshold || 5000,
            enableFreeShipping: d.settings.enableFreeShipping ?? true
          });
        }
      });
  }, []);

  const shipping = (settings.enableFreeShipping && totalPrice >= settings.freeShippingThreshold) ? 0 : settings.shippingFee;
  const grandTotal = totalPrice + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setPlacing(true);
    setError("");

    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.salePrice || item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email, // 👈 Email API ko bheji ja rahi hai
          customerAddress: form.address,
          notes: form.notes,
          items: orderItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      setOrderSnapshot({
        items: [...items],
        form: { ...form },
        subtotal: totalPrice,
        shipping,
        total: grandTotal,
      });
      setOrderId(data.order.orderNumber);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setPlacing(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    clearCart();
    setForm({ name: "", phone: "", email: "", address: "", notes: "" }); // Reset form
    router.push("/");
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "16px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "16px", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <ShoppingCart size={24} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "20px", fontWeight: "500", color: "var(--text-primary)" }}>
            My Cart
            {totalItems > 0 && <span style={{ fontSize: "14px", color: "var(--text-muted)", marginLeft: "8px", fontWeight: "400" }}>({totalItems} items)</span>}
          </h1>
        </div>

        {items.length === 0 && !showSuccess ? (
          <div className="dz-card" style={{ padding: "40px 20px", textAlign: "center" }}>
            <ShoppingCart size={48} style={{ color: "var(--border-strong)", marginBottom: "16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "8px" }}>Your cart is empty</h2>
            <Link href="/" className="dz-btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>Start Shopping</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="cart-responsive-grid">
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              {items.map((item) => {
                const price = item.salePrice || item.price;
                const lineTotal = price * item.quantity;
                return (
                  <div key={item.id} className="dz-card" style={{ padding: "12px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <img src={item.image} alt={item.name} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "3px" }} />
                    <div style={{ flex: 1, minWidth: "140px" }}>
                      <h3 className="line-clamp-2" style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>{item.name}</h3>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent)" }}>Rs. {price.toLocaleString()}</span>
                        {item.salePrice && <span style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "line-through" }}>Rs. {item.price.toLocaleString()}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-strong)", borderRadius: "3px", background: "var(--surface)" }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: "6px 8px", color: "var(--text-secondary)", background: "transparent", border: "none" }}><Minus size={14} /></button>
                      <span style={{ fontSize: "14px", minWidth: "24px", textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: "6px 8px", color: "var(--text-secondary)", background: "transparent", border: "none" }}><Plus size={14} /></button>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", minWidth: "80px", textAlign: "right" }}>Rs. {lineTotal.toLocaleString()}</div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer" }}><Trash2 size={16} /></button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
              
              <div className="dz-card" style={{ padding: "20px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "500", marginBottom: "16px" }}>Order Summary</h2>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span>Subtotal</span><span>Rs. {totalPrice.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span style={{ color: "#10B981" }}>FREE</span> : `Rs. ${shipping}`}</span>
                </div>
                {settings.enableFreeShipping && shipping > 0 && (
                   <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                     Add Rs. {(settings.freeShippingThreshold - totalPrice).toLocaleString()} more for free shipping
                   </p>
                )}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "700" }}>
                  <span>Total</span><span style={{ color: "var(--accent)" }}>Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handlePlaceOrder} className="dz-card" style={{ padding: "20px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "500", marginBottom: "16px" }}>Delivery Details</h2>
                
                <label style={{ display: "block", fontSize: "12px", marginBottom: "6px" }}>Full Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ali Khan" className="dz-input" style={{ marginBottom: "12px" }} />
                
                <label style={{ display: "block", fontSize: "12px", marginBottom: "6px" }}>Phone Number</label>
                <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 1234567" className="dz-input" style={{ marginBottom: "12px" }} />
                
                {/* NAYA: EMAIL INPUT */}
                <label style={{ display: "block", fontSize: "12px", marginBottom: "6px" }}>Email Address (For Order Confirmation)</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="dz-input" style={{ marginBottom: "12px" }} />

                <label style={{ display: "block", fontSize: "12px", marginBottom: "6px" }}>Delivery Address</label>
                <textarea required rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House #, Street" className="dz-input" style={{ resize: "none", marginBottom: "16px" }} />
                
                <div style={{ background: "var(--bg-alt)", padding: "12px", borderRadius: "3px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>PAYMENT METHOD</div>
                  <div style={{ fontSize: "14px", fontWeight: "500" }}>Cash on Delivery</div>
                </div>
                {error && <div style={{ background: "#FEE", color: "#EF4444", padding: "10px", borderRadius: "3px", fontSize: "12px", marginBottom: "12px" }}>{error}</div>}
                <button type="submit" disabled={placing} className="dz-btn-primary" style={{ width: "100%", padding: "12px" }}>
                  {placing ? "Placing..." : `Place Order — Rs. ${grandTotal.toLocaleString()}`}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showSuccess && orderSnapshot && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", borderRadius: "6px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", padding: "24px", position: "relative" }}>
            <button onClick={handleCloseSuccess} style={{ position: "absolute", top: "12px", right: "12px", background: "transparent", border: "none" }}><X size={18} /></button>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <CheckCircle2 size={48} style={{ color: "#10B981", marginBottom: "12px" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Order Placed!</h2>
              <p style={{ fontSize: "13px", color: "#666" }}>Order ID: <strong>{orderId}</strong></p>
              <p style={{ fontSize: "13px", color: "var(--accent)", marginTop: "8px" }}>Please check your email to verify the order.</p>
            </div>
            <button onClick={handleCloseSuccess} className="dz-btn-primary" style={{ width: "100%", padding: "12px" }}>Continue Shopping</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .cart-responsive-grid { display: flex; flex-direction: column; }
        @media (min-width: 900px) {
          .cart-responsive-grid {
            display: grid !important;
            grid-template-columns: 2fr 1fr !important;
            align-items: start;
          }
        }
      `}</style>
    </div>
  );
}