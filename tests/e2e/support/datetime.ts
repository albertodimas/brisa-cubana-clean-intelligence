export function futureDateAtHour(
  hour: number,
  minute = 0,
  second = 0,
  millisecond = 0,
): Date {
  const date = new Date();
  const reference = new Date(date);
  if (
    reference.getHours() > hour ||
    (reference.getHours() === hour && reference.getMinutes() >= minute)
  ) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(hour, minute, second, millisecond);
  return date;
}
