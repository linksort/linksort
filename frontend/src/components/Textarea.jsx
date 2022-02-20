import React from "react";
import { Box } from "@chakra-ui/react";
import { useMediaQuery } from "@chakra-ui/react";

function getIndex(isMobile, isTablet, isDesktop, isHD) {
  switch (true) {
    case isHD:
      return 3;
    case isDesktop:
      return 2;
    case isTablet:
      return 1;
    case isMobile:
      return 0;
    default:
      return 0;
  }
}

export default function Textarea({
  value,
  onChange,
  cols,
  minRows,
  maxRows,
  ...props
}) {
  let computedCols = cols;

  const [isMobile, isTablet, isDesktop, isHD] = useMediaQuery([
    "(min-width: 640px)",
    "(min-width: 768px)",
    "(min-width: 1024px)",
    "(min-width: 1280px)",
  ]);

  if (Array.isArray(cols)) {
    computedCols =
      cols[
        Math.min(getIndex(isMobile, isTablet, isDesktop, isHD), cols.length - 1)
      ];
  }

  const computed = value
    .split(/\n/)
    .reduce(
      (acc, cur) => acc + Math.max(Math.round(cur.length / computedCols), 1),
      1
    );
  const rows = Math.min(Math.max(computed, minRows), maxRows);

  return (
    <Box
      as="textarea"
      rows={rows}
      cols={computedCols}
      value={value}
      onChange={onChange}
      resize="none"
      outline="none"
      overflow="visible"
      {...props}
    />
  );
}
