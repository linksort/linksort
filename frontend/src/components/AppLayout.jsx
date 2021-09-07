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
import Sidebar from "./Sidebar";
import { useFilterParams } from "../hooks/filters";

const HEADER_HEIGHT = "5rem";

export default function AppLayout({ children }) {
  const { folder, favorite, search } = useFilterParams();
  const isSearching = search && search.length > 0;
  const isViewingFavorites = favorite === "1";

  let heading = folder;

  if (isSearching && isViewingFavorites) {
    heading = `Searching for "${search}" among favorites in ${folder}`;
  } else if (isSearching) {
    heading = `Searching for "${search}" in ${folder}`;
  } else if (isViewingFavorites) {
    heading = `Favorites in ${heading}`;
  }

  return (
    <Container maxWidth="7xl" px={6} position="relative" overflowX="hidden">
      <Grid
        maxWidth="100%"
        width="100%"
        minHeight="100vh"
        templateColumns={["1fr", "1fr", "16rem 1fr", "16rem 1fr"]}
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
          >
            <Box
              width="50%"
              borderBottom="1px"
              borderBottomColor="gray.100"
              height={HEADER_HEIGHT}
            />
          </Flex>
          <Box position="fixed" width="100%" top="0" left="0">
            <Container maxWidth="7xl" px={[0, 0, 6, 6]}>
              <Flex
                paddingLeft={6}
                paddingRight={[6, 6, 0, 0]}
                marginLeft={["0rem", "0rem", "16rem", "16rem"]}
                width={[
                  "100%",
                  "100%",
                  "calc(100% - 16rem)",
                  "calc(100% - 16rem)",
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
                  <TopRightUserMenu />
                </Stack>
              </Flex>
            </Container>
          </Box>
          <Box
            as="main"
            marginTop={HEADER_HEIGHT}
            paddingTop={4}
            paddingLeft={[0, 0, 6, 6]}
          >
            {children}
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
}
