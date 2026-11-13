/** Client-approved expiry reminder milestones (Prompt #25 / D14 superseded). */
export const EXPIRY_REMINDER_DAYS_BEFORE = [60, 30, 15, 7, 5, 4, 3, 2, 1, 0] as const;

export const EXPIRY_REMINDER_MAX_LEAD_DAYS = Math.max(...EXPIRY_REMINDER_DAYS_BEFORE);

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function dateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Whole calendar days from `asOf` (inclusive) until `expiry` (exclusive of past). */
export function daysUntilExpiryDateOnly(asOf: Date, expiry: Date): number {
  const a = startOfUtcDay(asOf).getTime();
  const b = startOfUtcDay(expiry).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function isExpiryReminderMilestone(daysUntil: number): boolean {
  return (EXPIRY_REMINDER_DAYS_BEFORE as readonly number[]).includes(daysUntil);
}
