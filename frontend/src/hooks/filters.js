import { pick } from "lodash";
import { useMemo } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import useQueryString from "./queryString";
import queryString from "query-string";

const DEFAULT_FILTER_PARAMS = {
  page: 0,
  search: null,
  sort: -1,
  group: "none",
  favorite: 0,
  folder: null,
};
const DEFAULT_FILTER_KEYS = Object.keys(DEFAULT_FILTER_PARAMS);

export function useFilterParams() {
  const query = useQueryString();

  return useMemo(() => {
    const cleanedQuery = pick(query, DEFAULT_FILTER_KEYS);
    return Object.assign({}, DEFAULT_FILTER_PARAMS, cleanedQuery);
  }, [query]);
}

export function useSortBy() {
  const history = useHistory();
  const { sort, ...rest } = useFilterParams();

  function toggleSort() {
    history.push(`?sort=${sort * -1}&${queryString.stringify(rest)}`);
  }

  const sortValue = sort > 0 ? "oldest first" : "newest first";

  return { toggleSort, sortValue };
}

const GROUP_BY_OPTIONS = ["none", "day", "site"];

export function useGroupBy() {
  const history = useHistory();
  const { group, ...rest } = useFilterParams();

  function toggleGroup() {
    const nextOption =
      GROUP_BY_OPTIONS[
        (GROUP_BY_OPTIONS.indexOf(group) + 1) % GROUP_BY_OPTIONS.length
      ];
    history.push(`?group=${nextOption}&${queryString.stringify(rest)}`);
  }

  const groupValue = group;

  return { toggleGroup, groupValue };
}

export function useSearch() {
  const history = useHistory();
  const { search, ...rest } = useFilterParams();

  function handleSearch(query) {
    history.push(
      `?search=${encodeURIComponent(query)}&${queryString.stringify(rest)}`
    );
  }

  return { handleSearch };
}
