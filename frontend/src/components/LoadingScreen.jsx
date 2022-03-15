import React from "react";
import { Skeleton, Stack } from "@chakra-ui/react";
import {
  useViewSetting,
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
} from "../hooks/views";

export default function LoadingScreen() {
  const { setting: viewSetting } = useViewSetting();

  let height, spacing, direction, width;
  switch (viewSetting) {
    case VIEW_SETTING_CONDENSED:
      height = 10;
      spacing = 2;
      direction = "column";
      width = "auto";
      break;
    case VIEW_SETTING_TALL:
      height = 20;
      spacing = 2;
      direction = "column";
      width = "auto";
      break;
    case VIEW_SETTING_TILES:
    default:
      height = "18rem";
      spacing = 4;
      direction = ["column", "column", "column", "row"];
      width = ["100%", "100%", "100%", "33%"];
      break;
  }

  return (
    <Stack padding={4} spacing={spacing} direction={direction}>
      <Skeleton height={height} width={width} />
      <Skeleton height={height} width={width} />
      <Skeleton height={height} width={width} />
    </Stack>
  );
}
