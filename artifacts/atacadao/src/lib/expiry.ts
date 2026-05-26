export function parseExpiry(expiryDate: string): Date | null {
  const parts = expiryDate.split("/");
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10);
  let year = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year)) return null;
  if (year < 100) year += 2000;
  if (month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1);
}

export function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export type ExpiryStatus = "expired" | "soon" | "ok";

export function getExpiryStatus(expiryDate: string | null | undefined): ExpiryStatus | null {
  if (!expiryDate) return null;
  const date = parseExpiry(expiryDate);
  if (!date) return null;
  const days = getDaysUntil(date);
  if (days <= 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
}
