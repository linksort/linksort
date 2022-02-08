import React from "react";
import { Box } from "@chakra-ui/react";

import FadeInImage from "./FadeInImage";

const COLORS = ["red", "blue", "cyan", "purple", "pink", "orange"];

function Color({ id }) {
  const idx = id.charCodeAt(1) % 6;
  const color = COLORS[idx];

  return <Box width="100%" height="100%" backgroundColor={`${color}.300`} />;
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
      fallback={<Color id={link.title} />}
      {...rest}
    />
  );
}
