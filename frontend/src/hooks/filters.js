import { pick } from "lodash";
import { useMemo } from "react";
import { useHistory } from "react-router-dom";
import queryString from "query-string";

import useQueryString from "./queryString";
import { useFolders } from "./folders";

const DEFAULT_FILTER_PARAMS = Object.freeze({
  page: "0",
  search: "",
  sort: "-1",
  group: "none",
  favorite: "0",
  folder: "root",
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
  const { resolveFolderName } = useFolders();

  return useMemo(() => {
    const sortDirection =
      filterParams.sort > 0 ? "oldest first" : "newest first";
    const groupName = filterParams.group;
    const areFavoritesShowing = filterParams.favorite === "1";
    const pageNumber = filterParams.page;
    const searchQuery = filterParams.search;
    const folderName = resolveFolderName(filterParams.folder);
    const folderId = filterParams.folder;

    function makeToggleSortLink() {
      const newFilterParams = Object.assign({}, filterParams, {
        sort: filterParams.sort * -1,
      });
      return `/?${queryString.stringify(newFilterParams)}`;
    }

    function makeToggleGroupLink() {
      const newFilterParams = Object.assign({}, filterParams, {
        group:
          GROUP_BY_OPTIONS[
            (GROUP_BY_OPTIONS.indexOf(filterParams.group) + 1) %
              GROUP_BY_OPTIONS.length
          ],
      });
      return `/?${queryString.stringify(newFilterParams)}`;
    }

    function makeToggleFavoritesLink() {
      const newFilterParams = Object.assign({}, filterParams, {
        favorite: filterParams.favorite === "0" ? "1" : "0",
      });
      return `/?${queryString.stringify(newFilterParams)}`;
    }

    function makeNextPageLink() {
      const newFilterParams = Object.assign({}, filterParams, {
        page: parseInt(filterParams.page) + 1,
      });
      return `/?${queryString.stringify(newFilterParams)}`;
    }

    function makePrevPageLink() {
      const newFilterParams = Object.assign({}, filterParams, {
        page: Math.max(0, parseInt(filterParams.page) - 1),
      });
      return `/?${queryString.stringify(newFilterParams)}`;
    }

    function makeFolderLink(folder) {
      const newFilterParams = Object.assign({}, filterParams, {
        folder: encodeURIComponent(folder),
      });
      return `/?${queryString.stringify(newFilterParams)}`;
    }

    function handleToggleSort() {
      history.push(makeToggleSortLink());
    }

    function handleToggleGroup() {
      history.push(makeToggleGroupLink());
    }

    function handleToggleFavorites() {
      history.push(makeToggleFavoritesLink());
    }

    function handleGoToNextPage() {
      history.push(makeNextPageLink());
    }

    function handleGoToPrevPage() {
      history.push(makePrevPageLink());
    }

    function handleGoToFolder(folder) {
      history.push(makeFolderLink(folder));
    }

    function handleSearch(query) {
      filterParams.search = encodeURIComponent(query);
      history.push(`?${queryString.stringify(filterParams)}`);
    }

    return {
      makeToggleSortLink,
      makeToggleGroupLink,
      makeToggleFavoritesLink,
      makeNextPageLink,
      makePrevPageLink,
      makeFolderLink,
      handleToggleSort,
      handleToggleGroup,
      handleToggleFavorites,
      handleSearch,
      handleGoToNextPage,
      handleGoToPrevPage,
      handleGoToFolder,
      sortDirection,
      groupName,
      areFavoritesShowing,
      searchQuery,
      pageNumber,
      folderName,
      folderId,
    };
  }, [filterParams, history, resolveFolderName]);
}
