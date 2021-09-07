import { pick } from "lodash";
import { useMemo } from "react";
import { useHistory } from "react-router-dom";
import queryString from "query-string";

import useQueryString from "./queryString";

const DEFAULT_FILTER_PARAMS = {
  page: "0",
  search: "",
  sort: "-1",
  group: "none",
  favorite: "0",
  folder: "All",
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
  const filterParams = useFilterParams();

  function toggleSort() {
    filterParams.sort = filterParams.sort * -1;
    history.push(`?${queryString.stringify(filterParams)}`);
  }

  const sortValue = filterParams.sort > 0 ? "oldest first" : "newest first";

  return { toggleSort, sortValue };
}

const GROUP_BY_OPTIONS = ["none", "day", "site"];

export function useGroupBy() {
  const history = useHistory();
  const filterParams = useFilterParams();

  function toggleGroup() {
    filterParams.group =
      GROUP_BY_OPTIONS[
        (GROUP_BY_OPTIONS.indexOf(filterParams.group) + 1) %
          GROUP_BY_OPTIONS.length
      ];
    history.push(`?${queryString.stringify(filterParams)}`);
  }

  const groupValue = filterParams.group;

  return { toggleGroup, groupValue };
}

export function useSearch() {
  const history = useHistory();
  const filterParams = useFilterParams();

  function handleSearch(query) {
    filterParams.search = encodeURIComponent(query);
    history.push(`?${queryString.stringify(filterParams)}`);
  }

  return { handleSearch };
}

export function useFavorites() {
  const history = useHistory();
  const filterParams = useFilterParams();

  function toggleFavorites() {
    filterParams.favorite = filterParams.favorite === "0" ? "1" : "0";
    history.push(`?${queryString.stringify(filterParams)}`);
  }

  const favoriteValue = filterParams.favorite === "1";

  return { toggleFavorites, favoriteValue };
}

export function usePagination() {
  const history = useHistory();
  const filterParams = useFilterParams();

  function nextPage() {
    filterParams.page = parseInt(filterParams.page) + 1;
    history.push(`?${queryString.stringify(filterParams)}`);
  }

  function prevPage() {
    filterParams.page = Math.max(0, parseInt(filterParams.page) - 1);
    history.push(`?${queryString.stringify(filterParams)}`);
  }

  return { nextPage, prevPage };
}
