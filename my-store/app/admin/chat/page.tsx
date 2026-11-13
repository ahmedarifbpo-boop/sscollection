
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  Smile,
  Loader2,
} from "lucide-react";
import Image from "next/image";

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

  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showMobileChat, setShowMobileChat] = useState(false);

  const emojis = [
    "😀", "😂", "🥰", "😎", "😭", "👍",
    "🙏", "🔥", "💯", "🛍️", "❤️", "✨",
  ];

  // Verify admin session
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }

        if (active) {
          setReady(true);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        router.replace("/admin/login");
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  // Fetch conversations
  useEffect(() => {
    if (!ready) return;

    let active = true;

    async function fetchChats() {
      try {
        const res = await fetch("/api/admin-chat", {
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch chats");
        }

        const data = await res.json();
        const convs = data.conversations || [];

        if (!active) return;

        setConversations(convs);

        setSelectedConvId(
          (prev) =>
            (prev && convs.some((c: Conversation) => c.id === prev)
              ? prev
              : null) || (convs.length > 0 ? convs[0].id : null)
        );
      } catch (e) {
        console.error(e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchChats();

    const interval = setInterval(fetchChats, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [ready, router]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConvId, conversations, showMobileChat]);

  // Send text or image message
  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedConvId) return;

    try {
      const sendRes = await fetch("/api/admin-chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          text,
        }),
      });

      if (sendRes.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!sendRes.ok) {
        throw new Error("Failed to send message");
      }

      const res = await fetch("/api/admin-chat", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to refresh chats");
      }

      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      console.error(e);
      alert("Failed to send message");
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim()) return;

    const text = replyText.trim();

    setReplyText("");
    setShowEmoji(false);

    await sendMessage(text);
  };

  // Image upload
  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !selectedConvId) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      await sendMessage(data.url);
    } catch (err) {
      console.error(err);
      alert("Image upload failed.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const isImageUrl = (text: string) => {
    return (
      /\.(jpeg|jpg|gif|png|webp)$/i.test(text) ||
      text.startsWith("data:image/")
    );
  };

  if (!ready || loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  const selectedConv =
    conversations.find((c) => c.id === selectedConvId) || null;

  return (
    <div className="admin-chat-page">
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "var(--text-primary)",
            letterSpacing: "-0.5px",
          }}
        >
          Live Chat Inbox
        </h1>
      </div>

      <div
        className={`chat-container ${
          showMobileChat ? "mobile-chat-open" : ""
        }`}
        style={{
          display: "flex",
          height: "calc(100dvh - 160px)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--glass-border)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
        }}
      >
        {/* LEFT SIDEBAR */}
        <div
          className="chat-sidebar"
          style={{
            width: "320px",
            borderRight: "1px solid var(--border)",
            background: "rgba(255,255,255,0.6)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-secondary)",
              position: "sticky",
              top: 0,
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(10px)",
              zIndex: 10,
            }}
          >
            All Conversations ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "13px",
              }}
            >
              No chats yet.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConvId === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    setShowMobileChat(true);
                  }}
                  className={`conv-item ${
                    isSelected ? "active" : ""
                  }`}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    textAlign: "left",
                    border: "none",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    cursor: "pointer",
                    background: isSelected
                      ? "rgba(248, 86, 6, 0.08)"
                      : "transparent",
                    borderLeft: isSelected
                      ? "4px solid var(--accent)"
                      : "4px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: isSelected ? "700" : "600",
                      color: isSelected
                        ? "var(--accent)"
                        : "var(--text-primary)",
                    }}
                  >
                    {conv.customerName}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    {conv.customerPhone}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* RIGHT CHAT WINDOW */}
        <div
          className="chat-main"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "rgba(250, 250, 250, 0.4)",
          }}
        >
          {selectedConv ? (
            <>
              {/* CHAT HEADER */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <button
                  className="mobile-back-btn"
                  onClick={() => setShowMobileChat(false)}
                  style={{
                    background: "none",
                    border: "none",
                    display: "none",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    padding: "4px",
                  }}
                >
                  <ArrowLeft size={22} />
                </button>

                <div>
                  <div style={{ fontSize: "16px", fontWeight: "700" }}>
                    {selectedConv.customerName}
                  </div>

                  <div
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    {selectedConv.customerPhone}
                  </div>
                </div>
              </div>

              {/* CHAT MESSAGES */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {selectedConv.messages.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  const isImg = isImageUrl(msg.text);

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isAdmin
                          ? "flex-end"
                          : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "75%",
                          background: isAdmin
                            ? "linear-gradient(135deg, var(--accent) 0%, #FF7B3D 100%)"
                            : "#FFFFFF",
                          color: isAdmin ? "#fff" : "#212121",
                          padding: isImg ? "4px" : "12px 16px",
                          borderRadius: isAdmin
                            ? "16px 16px 4px 16px"
                            : "16px 16px 16px 4px",
                          fontSize: "14px",
                          boxShadow: isAdmin
                            ? "0 4px 15px rgba(248, 86, 6, 0.2)"
                            : "0 2px 10px rgba(0,0,0,0.05)",
                          border: isAdmin
                            ? "none"
                            : "1px solid rgba(0,0,0,0.04)",
                        }}
                      >
                        {isImg ? (
                          <div
                            style={{
                              position: "relative",
                              width: "200px",
                              height: "150px",
                              borderRadius: "12px",
                              overflow: "hidden",
                            }}
                          >
                            <Image
                              src={msg.text}
                              alt="Attachment"
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        ) : (
                          <div style={{ lineHeight: "1.4" }}>
                            {msg.text}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: "10px",
                            marginTop: isImg ? "4px" : "6px",
                            opacity: 0.8,
                            textAlign: isAdmin ? "right" : "left",
                            fontWeight: "500",
                            padding: isImg ? "0 8px 8px" : "0",
                          }}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={bottomRef} />
              </div>

              {/* CHAT INPUT */}
              <div
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(10px)",
                  position: "relative",
                }}
              >
                {showEmoji && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: "20px",
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                      padding: "10px",
                      boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "8px",
                      zIndex: 10,
                    }}
                  >
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() =>
                          setReplyText((prev) => prev + emoji)
                        }
                        style={{
                          fontSize: "20px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleReply}
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#777",
                      cursor: uploading ? "not-allowed" : "pointer",
                      display: "flex",
                      padding: "8px",
                    }}
                  >
                    {uploading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <ImageIcon size={20} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEmoji(!showEmoji)}
                    style={{
                      background: "none",
                      border: "none",
                      color: showEmoji ? "var(--accent)" : "#777",
                      cursor: "pointer",
                      display: "flex",
                      padding: "8px",
                    }}
                  >
                    <Smile size={20} />
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      borderRadius: "30px",
                      border: "1px solid rgba(0,0,0,0.1)",
                      outline: "none",
                      background: "#F4F5F7",
                      fontSize: "14px",
                      transition: "border 0.2s",
                    }}
                  />

                  <button
                    type="submit"
                    className="dz-btn-primary"
                    disabled={uploading || !replyText.trim()}
                    style={{
                      padding: "12px 24px",
                      borderRadius: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 15px rgba(248, 86, 6, 0.3)",
                      opacity:
                        uploading || !replyText.trim() ? 0.5 : 1,
                    }}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  background: "rgba(0,0,0,0.03)",
                  padding: "20px",
                  borderRadius: "50%",
                  marginBottom: "16px",
                }}
              >
                <MessageSquare size={48} style={{ opacity: 0.3 }} />
              </div>

              <p style={{ fontSize: "15px", fontWeight: "500" }}>
                Select a chat to start replying
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .conv-item:hover {
          background: rgba(0, 0, 0, 0.02) !important;
        }

        input:focus {
          border-color: var(--accent) !important;
          background: #ffffff !important;
        }

        @media (max-width: 768px) {
          .chat-sidebar {
            width: 100% !important;
            border-right: none !important;
          }

          .chat-main {
            display: none !important;
          }

          .mobile-chat-open .chat-sidebar {
            display: none !important;
          }

          .mobile-chat-open .chat-main {
            display: flex !important;
          }

          .mobile-back-btn {
            display: block !important;
          }

          .admin-chat-page {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
