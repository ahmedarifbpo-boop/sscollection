"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  updatedAt: string;
  messages: Message[];
}

export default function AdminChatPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const admin = localStorage.getItem("ss-admin");
    if (!admin) {
      router.push("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;

    async function fetchChats() {
      try {
        const res = await fetch("/api/admin-chat");
        const data = await res.json();
        const convs = data.conversations || [];
        setConversations(convs);
        
        // Agar pehle se koi selected nahi hai, to pehla select kar lo
        setSelectedConvId((prev) => prev || (convs.length > 0 ? convs[0].id : null));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [ready]); // 🔥 Sirf ready pe depend karta hai, loop nahi banega

  // Auto scroll
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConvId, conversations]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId) return;

    const text = replyText.trim();
    setReplyText("");

    try {
      await fetch("/api/admin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvId, text }),
      });
      
      // Manually list refresh karo
      const res = await fetch("/api/admin-chat");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      alert("Failed to send reply");
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

  if (!ready || loading) return <div style={{ padding: "60px", textAlign: "center" }}>Loading...</div>;

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || null;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "500", color: "var(--text-primary)" }}>Live Chat Inbox</h1>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 200px)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}>
        {/* Left Sidebar */}
        <div style={{ width: "320px", borderRight: "1px solid var(--border)", background: "var(--bg-alt)", overflowY: "auto" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: "600" }}>All Conversations</div>
          {conversations.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No chats yet.</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                style={{
                  width: "100%", padding: "16px", textAlign: "left", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                  background: selectedConvId === conv.id ? "var(--surface)" : "transparent",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{conv.customerName}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{conv.customerPhone}</div>
              </button>
            ))
          )}
        </div>

        {/* Right Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
          {selectedConv ? (
            <>
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                <div style={{ fontSize: "15px", fontWeight: "600" }}>{selectedConv.customerName}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{selectedConv.customerPhone}</div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedConv.messages.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender === "admin" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "70%", background: msg.sender === "admin" ? "var(--accent)" : "#fff", color: msg.sender === "admin" ? "#fff" : "#212121", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", border: msg.sender === "customer" ? "1px solid #DDD" : "none" }}>
                      <div>{msg.text}</div>
                      <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.7, textAlign: msg.sender === "admin" ? "right" : "left" }}>{formatTime(msg.createdAt)}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: "16px", borderTop: "1px solid var(--border)", background: "#fff" }}>
                <form onSubmit={handleReply} style={{ display: "flex", gap: "10px" }}>
                  <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type reply..." className="dz-input" style={{ flex: 1 }} />
                  <button type="submit" className="dz-btn-primary" style={{ padding: "0 20px" }}>Send</button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "var(--text-muted)" }}>
              <MessageSquare size={48} style={{ marginBottom: "16px", opacity: 0.2 }} />
              <p>Select a chat to reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}