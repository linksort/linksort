import { parseISO, format } from "date-fns";

export function isoDateToHeading(date) {
  const dt = parseISO(date);
  return format(dt, "EEEE d LLLL");
}

export function isoDateToAtTimeOnDate(date) {
  const dt = parseISO(date);
  return format(dt, "h:mmaa 'on' d MMMM yyyy");
}

// Short form for tight rows: "26 Oct 2026".
export function isoDateToShortDate(date) {
  const dt = parseISO(date);
  return format(dt, "d MMM yyyy");
}
