import { useEffect } from "react";
import { useListStockItems } from "@workspace/api-client-react";
import { parseExpiry, getDaysUntil } from "@/lib/expiry";

export function useExpiryNotifications() {
  const { data: items } = useListStockItems();

  useEffect(() => {
    if (!items || !("Notification" in window)) return;

    const today = new Date().toDateString();
    const lastChecked = localStorage.getItem("expiryNotifDate");
    if (lastChecked === today) return;

    const expiring = items
      .filter((item) => {
        if (!item.expiryDate) return false;
        const date = parseExpiry(item.expiryDate);
        if (!date) return false;
        return getDaysUntil(date) <= 30;
      })
      .map((item) => {
        const date = parseExpiry(item.expiryDate!)!;
        return { name: item.productName, days: getDaysUntil(date) };
      })
      .sort((a, b) => a.days - b.days);

    if (expiring.length === 0) return;

    const notify = () => {
      localStorage.setItem("expiryNotifDate", today);
      const expired = expiring.filter((e) => e.days <= 0);
      const soon = expiring.filter((e) => e.days > 0 && e.days <= 7);
      const later = expiring.filter((e) => e.days > 7);

      let body = "";
      if (expired.length > 0) body += `🔴 ${expired.length} vencido(s). `;
      if (soon.length > 0) body += `🟡 ${soon.length} vence em até 7 dias. `;
      if (later.length > 0) body += `⚪ ${later.length} vence em até 30 dias.`;

      new Notification("Atacadão Frios — Validades", {
        body: body.trim(),
        icon: "/icon-pwa.png",
        badge: "/icon-pwa.png",
        tag: "expiry-check",
      });
    };

    if (Notification.permission === "granted") {
      notify();
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") notify();
      });
    }
  }, [items]);
}

export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}
