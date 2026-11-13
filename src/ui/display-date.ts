/**
 * The default display format for dates and times in the UI:
 * "Saturday, November 14th at 7:00 am" (date only: "Saturday, November 14th").
 * Takes the stored form ("2026-11-14 07:00", "T" separator also accepted).
 * Anything else is returned unchanged, since an Action Step's agreed time is
 * the Brain's text and may not be a timestamp.
 */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const STORED = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::\d{2})?)?$/;

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][day % 10] ?? 'th';
  return `${day}${suffix}`;
}

export function formatDisplayDate(stored: string): string {
  const match = STORED.exec(stored.trim());
  if (match == null) return stored;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return stored;
  const datePart = `${DAYS[date.getDay()]}, ${MONTHS[month - 1]} ${ordinal(day)}`;
  if (match[4] == null) return datePart;
  const hour = Number(match[4]);
  if (hour > 23 || Number(match[5]) > 59) return stored;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${datePart} at ${hour12}:${match[5]} ${hour < 12 ? 'am' : 'pm'}`;
}
