import React from "react";
import { Box, Skeleton, Stack } from "@chakra-ui/react";
import {
  useViewSetting,
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
} from "../hooks/views";

export default function LoadingScreen() {
  const { setting: viewSetting } = useViewSetting();

  let height, spacing, direction, width, borderRadius;
  switch (viewSetting) {
    case VIEW_SETTING_CONDENSED:
      height = 10;
      spacing = 2;
      direction = "column";
      width = "auto";
      borderRadius = "md";
      break;
    case VIEW_SETTING_TALL:
      height = 20;
      spacing = 2;
      direction = "column";
      width = "auto";
      borderRadius = "xl";
      break;
    case VIEW_SETTING_TILES:
    default:
      height = "18rem";
      spacing = 6;
      direction = ["column", "column", "column", "row"];
      width = ["100%", "100%", "100%", "33%"];
      borderRadius = "xl";
      break;
  }

  return (
    <Box maxWidth="5xl" width="100%" marginX="auto">
      <Stack padding={6} spacing={spacing} direction={direction}>
        <Skeleton height={height} width={width} borderRadius={borderRadius} />
        <Skeleton height={height} width={width} borderRadius={borderRadius} />
        <Skeleton height={height} width={width} borderRadius={borderRadius} />
      </Stack>
    </Box>
  );
}
