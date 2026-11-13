
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { ChatProvider } from "@/lib/chat";
import CartToast from "@/components/CartToast";
import ClientLayout from "./ClientLayout";
import Tracker from "@/components/Tracker";

export const metadata: Metadata = {
  title: "S.S Collection — Online Shopping",
  description: "Fashion, Electronics, Jewellery & more",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ChatProvider>
          <CartProvider>
            <CartToast />

            <Suspense fallback={null}>
              <Tracker />
            </Suspense>

            <ClientLayout>{children}</ClientLayout>
          </CartProvider>
        </ChatProvider>
      </body>
    </html>
  );
}
