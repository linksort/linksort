import { pick } from "lodash";
import { useMemo } from "react";
import { useHistory } from "react-router-dom";
import queryString from "query-string";

import useQueryString from "./queryString";

const DEFAULT_FILTER_PARAMS = Object.freeze({
  page: "0",
  search: "",
  sort: "-1",
  group: "none",
  favorite: "0",
  folder: "All",
});
const DEFAULT_FILTER_KEYS = Object.keys(DEFAULT_FILTER_PARAMS);
const GROUP_BY_OPTIONS = ["none", "day", "site"];

export function useFilterParams() {
  const query = useQueryString();

  return useMemo(() => {
    const cleanedQuery = pick(query, DEFAULT_FILTER_KEYS);
    return Object.assign({}, DEFAULT_FILTER_PARAMS, cleanedQuery);
  }, [query]);
}

export function useFilters() {
  const history = useHistory();
  const filterParams = useFilterParams();

  return useMemo(() => {
    const sortDirection =
      filterParams.sort > 0 ? "oldest first" : "newest first";
    const groupName = filterParams.group;
    const areFavoritesShowing = filterParams.favorite === "1";
    const pageNumber = filterParams.page;
    const searchQuery = filterParams.search;

    function handleToggleSort() {
      filterParams.sort = filterParams.sort * -1;
      history.push(`?${queryString.stringify(filterParams)}`);
    }

    function handleToggleGroup() {
      filterParams.group =
        GROUP_BY_OPTIONS[
          (GROUP_BY_OPTIONS.indexOf(filterParams.group) + 1) %
            GROUP_BY_OPTIONS.length
        ];
      history.push(`?${queryString.stringify(filterParams)}`);
    }

    function handleToggleFavorites() {
      filterParams.favorite = filterParams.favorite === "0" ? "1" : "0";
      history.push(`?${queryString.stringify(filterParams)}`);
    }

    function handleSearch(query) {
      filterParams.search = encodeURIComponent(query);
      history.push(`?${queryString.stringify(filterParams)}`);
    }

    function handleGoToNextPage() {
      filterParams.page = parseInt(filterParams.page) + 1;
      history.push(`?${queryString.stringify(filterParams)}`);
    }

    function handleGoToPrevPage() {
      filterParams.page = Math.max(0, parseInt(filterParams.page) - 1);
      history.push(`?${queryString.stringify(filterParams)}`);
    }

    return {
      handleToggleSort,
      handleToggleGroup,
      handleToggleFavorites,
      handleSearch,
      handleGoToNextPage,
      handleGoToPrevPage,
      sortDirection,
      groupName,
      areFavoritesShowing,
      searchQuery,
      pageNumber,
    };
  }, [filterParams, history]);
}
