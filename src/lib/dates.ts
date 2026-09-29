// Pure date-only math, deliberately UTC-anchored throughout: parsing and
// producing dates via Date.UTC/toISOString sidesteps server-timezone
// ambiguity between a laptop in `pnpm dev` and Fly's UTC containers — a
// day-boundary calculation done entirely in UTC never depends on local
// offset. Depends only on the host clock being roughly correct, which is a
// fine assumption for a prototype.
const MS_PER_DAY = 86_400_000;
export const TEACHING_WEEKS = 12;

function toUTCDay(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function todayUTC(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** ISO date string `days` away from `from` (defaults to now), UTC-anchored. */
export function addDaysISO(days: number, from: Date = new Date()): string {
  return new Date(todayUTC(from) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Which teaching week `termStart` puts "now" in, or null outside 1..TEACHING_WEEKS. */
export function currentWeekFor(termStart: string, now: Date = new Date()): number | null {
  const daysSince = Math.floor((todayUTC(now) - toUTCDay(termStart)) / MS_PER_DAY);
  const week = Math.floor(daysSince / 7) + 1;
  return week >= 1 && week <= TEACHING_WEEKS ? week : null;
}

export type DueStatus = "overdue" | "due-soon" | "upcoming";

/** overdue: past due · due-soon: due within 7 days · upcoming: further out. */
export function dueStatus(dueDate: string, now: Date = new Date()): DueStatus {
  const daysUntil = Math.floor((toUTCDay(dueDate) - todayUTC(now)) / MS_PER_DAY);
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 7) return "due-soon";
  return "upcoming";
}
