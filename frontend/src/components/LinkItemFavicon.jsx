import React from "react";
import { Image, Box } from "@chakra-ui/react";

export default function LinkItemFavicon({ favicon, ...rest }) {
  return (
    <Box
      height="1.3rem"
      width="1.3rem"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexShrink="0"
      marginRight={2}
      {...rest}
    >
      <Image
        height="100%"
        width="100%"
        src={favicon}
        fallbackSrc="/globe-favicon.png"
      />
    </Box>
  );
}
