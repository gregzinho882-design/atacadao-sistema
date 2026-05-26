import { useEffect } from "react";
import { useListStockItems } from "@workspace/api-client-react";

function parseExpiry(expiryDate: string): Date | null {
  const parts = expiryDate.split("/");
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year)) return null;
  return new Date(year, month - 1, 1);
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

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
        const days = getDaysUntil(date);
        return days <= 30;
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
