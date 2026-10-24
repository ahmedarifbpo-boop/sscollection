import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { ChatProvider } from "@/lib/chat";
import CartToast from "@/components/CartToast";
import ClientLayout from "./ClientLayout";
import Tracker from "@/components/Tracker"; // 👈 Naya Import

export const metadata: Metadata = {
  title: "S.S Collection — Online Shopping",
  description: "Fashion, Electronics, Jewellery & more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ChatProvider>
          <CartProvider>
            <CartToast />
            <Tracker /> {/* 👈 Naya Tracker Component Yahan Add Hua */}
            <ClientLayout>{children}</ClientLayout>
          </CartProvider>
        </ChatProvider>
      </body>
    </html>
  );
}