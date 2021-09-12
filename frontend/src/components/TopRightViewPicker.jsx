import React from "react";
import { Flex, IconButton, Tooltip } from "@chakra-ui/react";

import { CondensedListIcon, MenuIcon, TilesIcon } from "./CustomIcons";
import {
  useViewSetting,
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
} from "../hooks/views";

export default function TopRightViewPicker() {
  const { setting, setSetting } = useViewSetting();

  return (
    <Flex>
      <Tooltip label="Condensed view">
        <IconButton
          colorScheme={setting === VIEW_SETTING_CONDENSED ? "brand" : "gray"}
          icon={<CondensedListIcon />}
          borderRightRadius="none"
          onClick={() => setSetting(VIEW_SETTING_CONDENSED)}
        />
      </Tooltip>
      <Tooltip label="Comfy view">
        <IconButton
          colorScheme={setting === VIEW_SETTING_TALL ? "brand" : "gray"}
          icon={<MenuIcon />}
          borderRadius="none"
          borderLeft="thin"
          borderRight="thin"
          borderColor="gray.200"
          borderRightStyle="solid"
          borderLeftStyle="solid"
          onClick={() => setSetting(VIEW_SETTING_TALL)}
        />
      </Tooltip>
      <Tooltip label="Tiled view">
        <IconButton
          colorScheme={setting === VIEW_SETTING_TILES ? "brand" : "gray"}
          icon={<TilesIcon />}
          borderLeftRadius="none"
          onClick={() => setSetting(VIEW_SETTING_TILES)}
        />
      </Tooltip>
    </Flex>
  );
}
