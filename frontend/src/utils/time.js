import { parseISO, format } from "date-fns";

export function isoDateToHeading(date) {
  const dt = parseISO(date);
  return format(dt, "EEEE d LLLL");
}
