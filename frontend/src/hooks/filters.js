import { createContext, useContext } from "react";
import { merge, pick } from "lodash";
import { useMemo } from "react";
import { useHistory } from "react-router-dom";
import queryString from "query-string";

import useQueryString from "./queryString";
import { useFolders } from "./folders";
import { useLocalStorage } from "./localStorage";

export const FILTER_KEY_PAGE = "page";
export const FILTER_KEY_SEARCH = "search";
export const FILTER_KEY_SORT = "sort";
export const FILTER_KEY_GROUP = "group";
export const FILTER_KEY_FAVORITE = "favorite";
export const FILTER_KEY_FOLDER = "folder";
export const FILTER_KEY_TAG = "tag";

const LOCALSTORAGE_FILTER_KEYS = [FILTER_KEY_SORT, FILTER_KEY_GROUP];
const QUERY_FILTER_KEYS = [
  FILTER_KEY_PAGE,
  FILTER_KEY_FOLDER,
  FILTER_KEY_FAVORITE,
  FILTER_KEY_SEARCH,
  FILTER_KEY_TAG,
];

const DEFAULT_FILTER_PARAMS = Object.freeze({
  [FILTER_KEY_PAGE]: "0",
  [FILTER_KEY_SEARCH]: "",
  [FILTER_KEY_SORT]: { root: "-1" },
  [FILTER_KEY_GROUP]: { root: "none" },
  [FILTER_KEY_FAVORITE]: "0",
  [FILTER_KEY_FOLDER]: "root",
  [FILTER_KEY_TAG]: "",
});

export const GROUP_BY_OPTION_NONE = "none";
export const GROUP_BY_OPTION_DAY = "day";
export const GROUP_BY_OPTION_SITE = "site";
export const GROUP_BY_OPTIONS = [
  GROUP_BY_OPTION_NONE,
  GROUP_BY_OPTION_DAY,
  GROUP_BY_OPTION_SITE,
];

const LOCALSTORAGE_KEY = "filters";
const DEFAULT_LOCALSTORAGE_VALUE = {
  [FILTER_KEY_SORT]: DEFAULT_FILTER_PARAMS[FILTER_KEY_SORT],
  [FILTER_KEY_GROUP]: DEFAULT_FILTER_PARAMS[FILTER_KEY_GROUP],
};

const Context = createContext([DEFAULT_LOCALSTORAGE_VALUE, () => {}]);

export function GlobalFiltersProvider({ children }) {
  const [localStore, setLocalStore] = useLocalStorage(
    LOCALSTORAGE_KEY,
    DEFAULT_LOCALSTORAGE_VALUE
  );

  return (
    <Context.Provider value={[localStore, setLocalStore]}>
      {children}
    </Context.Provider>
  );
}

function useLocalStorageParams() {
  const [localStore, setLocalStore] = useContext(Context);
  const values = pick(localStore, LOCALSTORAGE_FILTER_KEYS);

  function setValues(valuesObj) {
    setLocalStore(merge({}, localStore, valuesObj));
  }

  return [values, setValues];
}

export function useFilterParams() {
  const query = useQueryString();
  const queryParams = pick(query, QUERY_FILTER_KEYS);
  const [localStorageParams] = useLocalStorageParams();

  const start = Object.assign(
    {},
    DEFAULT_FILTER_PARAMS,
    queryParams,
    localStorageParams
  );

  const index = start.folder + unescape(start.tag);
  const sort = start.sort[index] || start.sort.root || start.sort || "-1";
  const group = start.group[index] || start.group.root || start.group || "none";

  return Object.assign(start, { sort, group });
}

function filterNonDefaultValues(params) {
  Object.entries(DEFAULT_FILTER_PARAMS).forEach(([key, value]) => {
    if (params[key] === value) {
      delete params[key];
    }
  });

  return params;
}

export function useFilters() {
  const history = useHistory();
  const { resolveFolderName } = useFolders();
  const [, setLocalStorageParam] = useLocalStorageParams();
  const filterParams = useFilterParams();

  return useMemo(() => {
    const sortDirection =
      filterParams.sort > 0 ? "oldest first" : "newest first";
    const groupName = filterParams.group;
    const areFavoritesShowing = filterParams.favorite === "1";
    const pageNumber = filterParams.page;
    const searchQuery = filterParams.search;
    const folderName = resolveFolderName(filterParams.folder);
    const folderId = filterParams.folder;
    const tagPath = unescape(filterParams.tag);
    const index = folderId + tagPath;

    function mergeParamAndStringify(param = {}) {
      return `/?${queryString.stringify(
        filterNonDefaultValues(
          Object.assign({}, pick(filterParams, QUERY_FILTER_KEYS), param)
        )
      )}`;
    }

    function makeToggleFavoritesLink() {
      return mergeParamAndStringify({
        favorite: filterParams.favorite === "0" ? "1" : "0",
      });
    }

    function makeNextPageLink() {
      return mergeParamAndStringify({
        page: parseInt(filterParams.page) + 1,
      });
    }

    function makePrevPageLink() {
      return mergeParamAndStringify({
        page: Math.max(0, parseInt(filterParams.page) - 1),
      });
    }

    function makeFolderLink(folder) {
      return mergeParamAndStringify({
        folder: encodeURIComponent(folder),
        tag: "",
        page: "0",
      });
    }

    function makeTagLink(tagPath) {
      return mergeParamAndStringify({
        tag: encodeURIComponent(tagPath),
        folder: "root",
      });
    }

    function handleToggleSort() {
      setLocalStorageParam({
        [FILTER_KEY_SORT]: { [index]: (filterParams.sort || -1) * -1 },
      });
    }

    function handleToggleGroup() {
      setLocalStorageParam({
        group: {
          [index]:
            GROUP_BY_OPTIONS[
              (GROUP_BY_OPTIONS.indexOf(filterParams.group) + 1) %
                GROUP_BY_OPTIONS.length
            ],
        },
      });
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

    function handleGoToTag(tagPath) {
      history.push(makeTagLink(tagPath));
    }

    function handleSearch(query) {
      history.push(
        mergeParamAndStringify({
          search: encodeURIComponent(query),
        })
      );
    }

    return {
      makeToggleFavoritesLink,
      makeNextPageLink,
      makePrevPageLink,
      makeFolderLink,
      makeTagLink,
      handleToggleSort,
      handleToggleGroup,
      handleToggleFavorites,
      handleSearch,
      handleGoToNextPage,
      handleGoToPrevPage,
      handleGoToFolder,
      handleGoToTag,
      sortDirection,
      groupName,
      areFavoritesShowing,
      searchQuery,
      pageNumber,
      folderName,
      folderId,
      tagPath,
    };
  }, [filterParams, history, resolveFolderName, setLocalStorageParam]);
}
