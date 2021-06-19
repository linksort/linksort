import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import queryString from "query-string";

export default function useQueryString() {
  const { search } = useLocation();
  return useMemo(() => queryString.parse(search), [search]);
}
