const { useState, createContext, useContext } = require("react");

export const VIEW_SETTING_CONDENSED = "condensed";
export const VIEW_SETTING_TALL = "tall";
export const VIEW_SETTING_TILES = "tiles";
export const VIEW_SETTINGS = [
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
];

const Context = createContext([VIEW_SETTING_CONDENSED, () => {}]);

export function ViewSettingProvider({ children }) {
  const [setting, setSetting] = useState(VIEW_SETTING_CONDENSED);

  return (
    <Context.Provider value={[setting, setSetting]}>
      {children}
    </Context.Provider>
  );
}

export function useViewSetting() {
  const [setting, setSetting] = useContext(Context);

  return { setting, setSetting };
}
