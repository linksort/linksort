import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Text, HStack, VStack, Skeleton } from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";

import LinkItemFavicon from "./LinkItemFavicon";
import CoverImage from "./CoverImage";
import { useLink } from "../hooks/links";

function Panel({ children }) {
  return (
    <Box
      margin={2}
      borderColor="gray.100"
      borderWidth="thin"
      borderRadius="lg"
      padding={2}
      backgroundColor="white"
      width="18rem"
    >
      {children}
    </Box>
  );
}

export default function GraphInfoPanel({ linkId }) {
  const {
    data: link = {},
    isLoading,
    isError,
    error,
  } = useLink(linkId, {
    enabled: linkId !== "",
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (isLoading) {
    return <Panel>Loading...</Panel>;
  }

  if (isError) {
    return <Panel>{error.toString()}</Panel>;
  }

  if (!linkId) {
    return <Panel>Choose a link to view its details.</Panel>;
  }

  return (
    <Panel>
      <VStack align="left" spacing={3}>
        {link.image && (
          <Box
            height="8rem"
            borderRadius="md"
            overflow="hidden"
            borderColor="gray.100"
            borderWidth="thin"
            display={["none", "none", "block", "block"]}
          >
            <CoverImage
              link={link}
              width="100%"
              height="8rem"
              fallback={<Skeleton height="100%" width="100%" />}
            />
          </Box>
        )}

        <Text as="h5" fontWeight="bold">
          {link.title}
        </Text>

        <Text as="p" fontSize="sm" display={["none", "none", "block", "block"]}>
          {link.description.length > 256
            ? link.description.slice(0, 256)
            : link.description}
        </Text>

        <HStack spacing={0}>
          <LinkItemFavicon favicon={link.favicon} />
          <Text fontSize="sm">{link.site}</Text>
        </HStack>

        <Button
          as={RouterLink}
          to={`/links/${link.id}`}
          leftIcon={<ViewIcon />}
          width="100%"
        >
          View
        </Button>
      </VStack>
    </Panel>
  );
}
