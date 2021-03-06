import React from "react";
import { Box, Flex, Text, Link, GridItem } from "@chakra-ui/react";

import CoverImage from "./CoverImage";
import LinkItemControls from "./LinkItemControls";

export default function LinkItemTile({ link }) {
  return (
    <GridItem
      height="18rem"
      borderRadius="xl"
      boxShadow="sm"
      border="thin"
      borderStyle="solid"
      borderColor="gray.100"
      overflow="hidden"
      backgroundColor="white"
      transition="background-color ease 0.2s"
      _hover={{ backgroundColor: "gray.50" }}
    >
      <Box>
        <Box height="10rem">
          <CoverImage link={link} width="full" height="10rem" />
        </Box>
        <Flex
          direction="column"
          justifyContent="space-between"
          paddingTop={2}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
          height="8rem"
          borderTop="thin"
          borderTopColor="gray.100"
          borderTopStyle="solid"
        >
          <Box overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            <Link href={link.url} isExternal _focus={{ boxShadow: "none" }}>
              <Text as="span" fontWeight="semibold" title={link.title}>
                {link.title}
              </Text>
            </Link>
            <Text fontSize="sm" title={link.site}>
              {link.site}
            </Text>
          </Box>
          <LinkItemControls link={link} />
        </Flex>
      </Box>
    </GridItem>
  );
}
