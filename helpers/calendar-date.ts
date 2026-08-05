/** Validates day/month pairs for calendar dates (leap-year Feb 29 allowed via 2024). */
export function isValidCalendarDayMonth(day: number, month: number) {
  const date = new Date(Date.UTC(2024, month - 1, day));

  return (
    date.getUTCFullYear() === 2024 &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
