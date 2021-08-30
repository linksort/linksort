import React from "react";
import { Box, Text } from "@chakra-ui/react";

export default function ErrorScreen({ error }) {
  return (
    <Box>
      <Text>{error.message}</Text>
    </Box>
  );
}
