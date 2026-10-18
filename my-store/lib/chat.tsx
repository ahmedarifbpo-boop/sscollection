"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface ChatMessage {
  id: string;
  sender: "customer" | "admin";
  text: string;
  timestamp: number;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  clearChat: () => void;
  unreadCount: number;
  markAllRead: () => void;
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: () => {},
  clearChat: () => {},
  unreadCount: 0,
  markAllRead: () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [lastReadAt, setLastReadAt] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ss-chat-messages");
      if (saved) setMessages(JSON.parse(saved));
      const read = localStorage.getItem("ss-chat-read");
      if (read) setLastReadAt(parseInt(read));
    } catch (e) {
      // ignore
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("ss-chat-messages", JSON.stringify(messages));
  }, [messages, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("ss-chat-read", lastReadAt.toString());
  }, [lastReadAt, mounted]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: "customer",
      text: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const clearChat = () => setMessages([]);

  const markAllRead = () => setLastReadAt(Date.now());

  // Unread = admin messages that came after last read
  const unreadCount = messages.filter(
    (m) => m.sender === "admin" && m.timestamp > lastReadAt
  ).length;

  return (
    <ChatContext.Provider
      value={{ messages, sendMessage, clearChat, unreadCount, markAllRead }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}