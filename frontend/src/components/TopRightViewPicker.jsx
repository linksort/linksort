import React from "react";
import { Flex, IconButton, Tooltip } from "@chakra-ui/react";

import { CondensedListIcon, MenuIcon, TilesIcon } from "./CustomIcons";
import {
  useViewSetting,
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
} from "../hooks/views";

export default function TopRightViewPicker({ isMobile }) {
  const { setting, setSetting } = useViewSetting();

  return (
    <Flex id={isMobile ? "mobile-view-setting" : "view-setting"}>
      <Tooltip label="Condensed view">
        <IconButton
          zIndex={1}
          colorScheme={setting === VIEW_SETTING_CONDENSED ? "brand" : "gray"}
          icon={<CondensedListIcon />}
          borderRightRadius="none"
          onClick={() => setSetting(VIEW_SETTING_CONDENSED)}
        />
      </Tooltip>
      <Tooltip label="Comfy view">
        <IconButton
          zIndex={setting === VIEW_SETTING_TALL ? 2 : 0}
          colorScheme={setting === VIEW_SETTING_TALL ? "brand" : "gray"}
          icon={<MenuIcon />}
          borderRadius="none"
          borderLeft={setting === VIEW_SETTING_TALL ? "none" : "thin"}
          borderRight={setting === VIEW_SETTING_TALL ? "none" : "thin"}
          borderColor="gray.200"
          borderRightStyle="solid"
          borderLeftStyle="solid"
          onClick={() => setSetting(VIEW_SETTING_TALL)}
        />
      </Tooltip>
      <Tooltip label="Tiled view">
        <IconButton
          zIndex={1}
          colorScheme={setting === VIEW_SETTING_TILES ? "brand" : "gray"}
          icon={<TilesIcon />}
          borderLeftRadius="none"
          onClick={() => setSetting(VIEW_SETTING_TILES)}
        />
      </Tooltip>
    </Flex>
  );
}
