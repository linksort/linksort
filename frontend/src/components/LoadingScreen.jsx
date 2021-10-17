import React from "react";
import { Skeleton, Stack } from "@chakra-ui/react";

export default function LoadingScreen() {
  return (
    <Stack padding={4} maxWidth="80ch">
      <Skeleton height={8} />
      <Skeleton height={8} />
      <Skeleton height={8} />
      <Skeleton height={8} />
    </Stack>
  );
}
