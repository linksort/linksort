import { createContext, useContext } from "react";

import { useLocalStorage } from "./localStorage";
import { useFilters } from "./filters";

export const VIEW_SETTING_CONDENSED = "condensed";
export const VIEW_SETTING_TALL = "tall";
export const VIEW_SETTING_TILES = "tiles";
export const VIEW_SETTINGS = [
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
];

const LOCALSTORAGE_KEY = "viewSetting";
const LOCALSTORAGE_OBJECT_KEY = "viewSetting";
const DEFAULT_LOCALSTORAGE_VALUE = {
  [LOCALSTORAGE_OBJECT_KEY]: VIEW_SETTING_TILES,
};

const Context = createContext([DEFAULT_LOCALSTORAGE_VALUE, () => {}]);

export function ViewSettingProvider({ children }) {
  const [setting, setSetting] = useLocalStorage(
    LOCALSTORAGE_KEY,
    DEFAULT_LOCALSTORAGE_VALUE
  );

  return (
    <Context.Provider value={[setting, setSetting]}>
      {children}
    </Context.Provider>
  );
}

export function useViewSetting() {
  const [localStore, setLocalStore] = useContext(Context);
  const { folderId, tagPath } = useFilters();

  const index = folderId + tagPath;
  const setting = localStore[index] || localStore.root || VIEW_SETTING_TILES;

  const setSetting = (newSetting) => {
    setLocalStore(Object.assign({}, localStore, { [index]: newSetting }));
  };

  return { setting, setSetting };
}
