
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getOrCreateId(key: string, storage: Storage) {
  let id = storage.getItem(key);

  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    storage.setItem(key, id);
  }

  return id;
}

export default function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    let visitorId: string;
    let sessionId: string;

    try {
      visitorId = getOrCreateId("ss-visitor-id", localStorage);
      sessionId = getOrCreateId("ss-session-id", sessionStorage);
    } catch {
      console.log("Visitor tracking storage unavailable");
      return;
    }

    const startedAt = Date.now();
    let pageViewSent = false;

    const params = new URLSearchParams(searchParams.toString());
    const utmSource = params.get("utm_source");

    const sendEvent = async (
      eventType: string,
      durationSeconds?: number
    ) => {
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          keepalive: true,
          body: JSON.stringify({
            page: pathname,
            eventType,
            visitorId,
            sessionId,
            referrer: document.referrer || null,
            utmSource,
            durationSeconds,
            eventData: {
              title: document.title,
            },
          }),
        });
      } catch (error) {
        console.log("Tracking failed:", error);
      }
    };

    const timer = setTimeout(async () => {
      await sendEvent("page_view");
      pageViewSent = true;
    }, 1000);

    return () => {
      clearTimeout(timer);

      if (pageViewSent) {
        const durationSeconds = Math.max(
          0,
          Math.floor((Date.now() - startedAt) / 1000)
        );

        void sendEvent("page_exit", durationSeconds);
      }
    };
  }, [pathname, searchParams]);

  return null;
}
