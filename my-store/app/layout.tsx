import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { ChatProvider } from "@/lib/chat";
import CartToast from "@/components/CartToast";
import ClientLayout from "./ClientLayout";

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
            <ClientLayout>{children}</ClientLayout>
          </CartProvider>
        </ChatProvider>
      </body>
    </html>
  );
}