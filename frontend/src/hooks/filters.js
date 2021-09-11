import { pick } from "lodash";
import { useMemo } from "react";
import { useHistory } from "react-router-dom";
import queryString from "query-string";

import useQueryString from "./queryString";
import { useUser } from "./auth";

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

function resolveFolderName(
  folderTree = { id: "root", name: "root", children: [] },
  folderId
) {
  if (folderId === "root") {
    return "All";
  }

  let queue = [folderTree];

  while (queue.length > 0) {
    let node = queue.shift();

    if (node.id === folderId) {
      return node.name;
    }

    queue.push(...node.children);
  }

  return "Unknown";
}

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
  const { folderTree } = useUser();

  return useMemo(() => {
    const sortDirection =
      filterParams.sort > 0 ? "oldest first" : "newest first";
    const groupName = filterParams.group;
    const areFavoritesShowing = filterParams.favorite === "1";
    const pageNumber = filterParams.page;
    const searchQuery = filterParams.search;
    const folderName = resolveFolderName(folderTree, filterParams.folder);

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

    function makeFolderLink(folder) {
      filterParams.folder = encodeURIComponent(folder);
      return `/?${queryString.stringify(filterParams)}`;
    }

    function handleGoToFolder(folder) {
      history.push(makeFolderLink(folder));
    }

    return {
      handleToggleSort,
      handleToggleGroup,
      handleToggleFavorites,
      handleSearch,
      handleGoToNextPage,
      handleGoToPrevPage,
      handleGoToFolder,
      makeFolderLink,
      sortDirection,
      groupName,
      areFavoritesShowing,
      searchQuery,
      pageNumber,
      folderName,
    };
  }, [filterParams, history, folderTree]);
}
