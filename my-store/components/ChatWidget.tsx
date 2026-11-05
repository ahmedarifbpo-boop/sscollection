"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Image as ImageIcon, Smile, Loader2 } from "lucide-react";
import Image from "next/image";

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
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emojis List
  const emojis = ["😀", "😂", "🥰", "😎", "😭", "👍", "🙏", "🔥", "💯", "🛍️", "❤️", "✨"];

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

  // Reusable message sender function
  const sendMessage = async (text: string) => {
    if (!text.trim() || !user) return;

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

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
    setShowEmoji(false);
  };

  // Image Upload Function
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      // Image URL ko text ki tarah bhej do
      await sendMessage(data.url);
    } catch (err) {
      alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

  // Check if message is an Image URL
  const isImageUrl = (text: string) => {
    return text.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null || text.startsWith("data:image/");
  };

  return (
    <div
      style={{
        position: "fixed", bottom: "16px", right: "16px", width: "calc(100vw - 32px)", maxWidth: "360px", 
        height: "calc(100vh - 120px)", maxHeight: "520px", background: "#fff", borderRadius: "12px", 
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", zIndex: 200, 
        overflow: "hidden", animation: "modalIn 0.25s ease",
      }}
    >
      <div style={{ background: "var(--accent)", color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>Help & Support</div>
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
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#FAFAFA", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#999", fontSize: "13px" }}>
                <MessageCircle size={40} style={{ color: "#DDDDDD", marginBottom: "12px" }} />
                <div style={{ fontWeight: "500", color: "#424242", marginBottom: "4px" }}>Welcome, {user.name}!</div>
                <div>Send us a message and we&apos;ll get back to you.</div>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender === "customer";
                const isImg = isImageUrl(m.text);
                
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{ 
                      maxWidth: "80%", 
                      background: isMe ? "var(--accent)" : "#fff", 
                      color: isMe ? "#fff" : "#212121", 
                      padding: isImg ? "4px" : "10px 12px", 
                      borderRadius: "12px", 
                      borderBottomRightRadius: isMe ? "2px" : "12px",
                      borderBottomLeftRadius: !isMe ? "2px" : "12px",
                      fontSize: "13px", 
                      border: !isMe ? "1px solid #DDDDDD" : "none", 
                      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      wordBreak: "break-word" 
                    }}>
                      {isImg ? (
                        <div style={{ position: "relative", width: "200px", height: "150px", borderRadius: "8px", overflow: "hidden" }}>
                          <Image src={m.text} alt="Attachment" fill style={{ objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div>{m.text}</div>
                      )}
                      
                      <div style={{ fontSize: "9px", marginTop: isImg ? "4px" : "6px", opacity: 0.7, textAlign: isMe ? "right" : "left", padding: isImg ? "0 4px 4px" : "0" }}>
                        {formatTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT AREA */}
          <div style={{ background: "#fff", borderTop: "1px solid #DDDDDD", position: "relative" }}>
            
            {/* Emoji Picker Popup */}
            {showEmoji && (
              <div style={{ position: "absolute", bottom: "100%", left: "12px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "10px", boxShadow: "0 -4px 20px rgba(0,0,0,0.1)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", zIndex: 10 }}>
                {emojis.map(emoji => (
                  <button key={emoji} type="button" onClick={() => addEmoji(emoji)} style={{ fontSize: "20px", background: "none", border: "none", cursor: "pointer", padding: "4px", transition: "transform 0.1s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSendText} style={{ padding: "10px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
              
              {/* File Upload Input (Hidden) */}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} style={{ display: "none" }} />
              
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ background: "none", border: "none", color: "#777", cursor: uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}>
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
              </button>

              <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={{ background: "none", border: "none", color: showEmoji ? "var(--accent)" : "#777", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}>
                <Smile size={20} />
              </button>

              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Type your message..." 
                style={{ flex: 1, border: "none", outline: "none", background: "#F4F5F7", padding: "10px 14px", borderRadius: "20px", fontSize: "13px" }} 
              />
              
              <button type="submit" disabled={!input.trim() || uploading} style={{ background: "var(--accent)", border: "none", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: (!input.trim() || uploading) ? "not-allowed" : "pointer", opacity: (!input.trim() || uploading) ? 0.5 : 1 }}>
                <Send size={16} style={{ marginLeft: "-2px" }} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}