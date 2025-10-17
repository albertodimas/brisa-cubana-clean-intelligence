/**
 * Formats a Date instance into the `input[type=datetime-local]` value expected by portal forms.
 */
export function toPortalDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
