import { parseISO, format } from "date-fns";

export function isoDateToHeading(date) {
  const dt = parseISO(date);
  return format(dt, "EEEE d LLLL");
}

export function isoDateToAtTimeOnDate(date) {
  const dt = parseISO(date);
  return format(dt, "h:mmaa 'on' d MMMM yyyy");
}
