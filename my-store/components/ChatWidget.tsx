"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, User, Mail } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "customer" | "admin";
  text: string;
  createdAt: string;
}

export default function ChatWidget({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<{ name: string; email: string; sessionId: string } | null>(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const savedUser = localStorage.getItem("ss-chat-user");
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?sessionId=${user.sessionId}`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch (e) {
        console.error("Fetch error", e);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newUser = {
      name: name.trim(),
      email: email.trim(),
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    localStorage.setItem("ss-chat-user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const text = input.trim();
    setInput("");

    const tempMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "customer",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: user.sessionId,
          customerName: user.name,
          customerEmail: user.email,
          text,
        }),
      });
    } catch (e) {
      console.error("Send error", e);
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      style={{
        position: "fixed", 
        bottom: "16px", 
        right: "16px", 
        width: "calc(100vw - 32px)", 
        maxWidth: "360px", 
        height: "calc(100vh - 120px)",
        maxHeight: "520px", 
        background: "#fff", 
        borderRadius: "6px", 
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", 
        display: "flex", 
        flexDirection: "column", 
        zIndex: 200, 
        overflow: "hidden",
        animation: "modalIn 0.25s ease",
      }}
    >
      <div style={{ background: "var(--accent)", color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "500" }}>Help & Support</div>
            <div style={{ fontSize: "11px", opacity: 0.9 }}>We typically reply in a few hours</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: "6px" }}><X size={18} /></button>
      </div>

      {!user ? (
        <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#FAFAFA" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", textAlign: "center" }}>Chat with us</h3>
          <form onSubmit={handleStartChat} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>Your Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ali Khan" className="dz-input" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="dz-input" />
            </div>
            <button type="submit" className="dz-btn-primary" style={{ width: "100%", padding: "10px", marginTop: "8px" }}>Start Chatting</button>
          </form>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#FAFAFA", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#999", fontSize: "13px" }}>
                <MessageCircle size={40} style={{ color: "#DDDDDD", marginBottom: "12px" }} />
                <div style={{ fontWeight: "500", color: "#424242", marginBottom: "4px" }}>Welcome, {user.name}!</div>
                <div>Send us a message and we&apos;ll get back to you.</div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.sender === "customer" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "85%", background: m.sender === "customer" ? "var(--accent)" : "#fff", color: m.sender === "customer" ? "#fff" : "#212121", padding: "10px 12px", borderRadius: "6px", fontSize: "13px", border: m.sender === "admin" ? "1px solid #DDDDDD" : "none", wordBreak: "break-word" }}>
                    <div>{m.text}</div>
                    <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.65, textAlign: m.sender === "customer" ? "right" : "left" }}>{formatTime(m.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} style={{ padding: "12px", background: "#fff", borderTop: "1px solid #DDDDDD", display: "flex", gap: "8px" }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="dz-input" style={{ flex: 1 }} />
            <button type="submit" disabled={!input.trim()} className="dz-btn-primary" style={{ padding: "10px 12px" }}><Send size={16} /></button>
          </form>
        </>
      )}
    </div>
  );
}