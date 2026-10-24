"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Har page change par API call karo
    const trackVisit = async () => {
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: pathname }),
        });
      } catch (e) {
        console.log("Tracking failed", e);
      }
    };

    // Thoda delay lagaya taake fast reload par bar bar na chale
    const timer = setTimeout(trackVisit, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null; // Ye screen par kuch nahi dikhata
}