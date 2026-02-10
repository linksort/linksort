import React from "react";
import { Box } from "@chakra-ui/react";

import FadeInImage from "./FadeInImage";

const COLORS = [
  "#E53E3E", // red
  "#3182CE", // blue
  "#00B5D8", // cyan
  "#805AD5", // purple
  "#D53F8C", // pink
  "#DD6B20", // orange
  "#38A169", // green
  "#D69E2E", // yellow
];

function hashChar(ch) {
  return ch ? ch.charCodeAt(0) : 0;
}

function Color({ id }) {
  const c1 = hashChar(id[0]) % COLORS.length;
  let c2 = (hashChar(id[1]) + hashChar(id[2])) % COLORS.length;
  if (c2 === c1) c2 = (c2 + 1) % COLORS.length;

  const angle = (hashChar(id[3]) + hashChar(id[4])) % 360;

  return (
    <Box
      width="100%"
      height="100%"
      background={`linear-gradient(${angle}deg, ${COLORS[c1]}, ${COLORS[c2]})`}
    />
  );
}

export default function CoverImage({
  link,
  width = "full",
  height = "auto",
  ...rest
}) {
  return (
    <FadeInImage
      src={link.image}
      width={width}
      height={height}
      objectFit="cover"
      fallback={<Color id={link.id} />}
      {...rest}
    />
  );
}
