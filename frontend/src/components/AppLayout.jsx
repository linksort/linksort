import React from "react";
import {
  Stack,
  Grid,
  GridItem,
  Heading,
  Flex,
  Container,
  Box,
} from "@chakra-ui/react";

import TopRightUserMenu from "./TopRightUserMenu";
import TopRightNewLinkPopover from "./TopRightNewLinkPopover";
import TopRightViewPicker from "./TopRightViewPicker";
import Sidebar from "./Sidebar";
import { useFilters } from "../hooks/filters";

const HEADER_HEIGHT = "5rem";

export default function AppLayout({ children }) {
  const {
    folderName,
    areFavoritesShowing,
    searchQuery,
    tagPath,
  } = useFilters();
  const isSearching = searchQuery && searchQuery.length > 0;
  const isViewingTag = tagPath.length > 0;

  let heading = isViewingTag ? tagPath : folderName;

  if (isSearching && areFavoritesShowing) {
    heading = `Searching for "${searchQuery}" among favorites in ${folderName}`;
  } else if (isSearching) {
    heading = `Searching for "${searchQuery}" in ${folderName}`;
  } else if (areFavoritesShowing) {
    heading = `Favorites in ${heading}`;
  }

  return (
    <Container maxWidth="7xl" px={6} position="relative" overflowX="hidden">
      <Grid
        maxWidth="100%"
        width="100%"
        minHeight="100vh"
        templateColumns={["1fr", "1fr", "18rem 1fr", "18rem 1fr"]}
      >
        <GridItem
          height="100%"
          display={["none", "none", "block", "block"]}
          borderRight="1px"
          borderRightColor="gray.100"
        >
          <Sidebar />
        </GridItem>
        <GridItem
          width="100%"
          maxWidth={[
            "calc(100vw - 3rem)",
            "calc(100vw - 3rem)",
            "calc(100vw - 19rem)",
            "calc(100vw - 19rem)",
          ]}
        >
          <Flex
            position="fixed"
            width="100%"
            top="0"
            left="0"
            justifyContent="flex-end"
            zIndex={1}
          >
            <Box
              width="50%"
              borderBottom="1px"
              borderBottomColor="gray.100"
              height={HEADER_HEIGHT}
              backgroundColor="white"
            />
          </Flex>
          <Box position="fixed" width="100%" top="0" left="0" zIndex={1}>
            <Container maxWidth="7xl" px={[0, 0, 6, 6]}>
              <Flex
                paddingLeft={6}
                paddingRight={[6, 6, 0, 0]}
                marginLeft={["0rem", "0rem", "18rem", "18rem"]}
                width={[
                  "100%",
                  "100%",
                  "calc(100% - 18rem)",
                  "calc(100% - 18rem)",
                ]}
                height={HEADER_HEIGHT}
                borderBottom="1px"
                borderBottomColor="gray.100"
                justifyContent="space-between"
                alignItems="center"
                backgroundColor="white"
              >
                <Heading as="h2" size="md">
                  {heading}
                </Heading>
                <Stack direction="row" as="nav" spacing={4}>
                  <TopRightNewLinkPopover />
                  <TopRightViewPicker />
                  <TopRightUserMenu />
                </Stack>
              </Flex>
            </Container>
          </Box>
          <Box as="main" marginTop={HEADER_HEIGHT}>
            {children}
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
}
