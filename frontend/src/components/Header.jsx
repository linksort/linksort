import React, { useRef } from "react";
import {
  Stack,
  Heading,
  Flex,
  Container,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

import TopRightUserMenu from "./TopRightUserMenu";
import TopRightNewLinkPopover from "./TopRightNewLinkPopover";
import TopRightViewPicker from "./TopRightViewPicker";
import { HEADER_HEIGHT } from "../theme/theme";
import { useFilters } from "../hooks/filters";
import Sidebar from "./Sidebar";

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const buttonRef = useRef();
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
    <Container maxWidth="7xl" px={[0, 0, 6, 6]}>
      <Flex
        paddingLeft={6}
        paddingRight={[6, 6, 0, 0]}
        marginLeft={["0rem", "0rem", "18rem", "18rem"]}
        width={["100%", "100%", "calc(100% - 18rem)", "calc(100% - 18rem)"]}
        height={HEADER_HEIGHT}
        borderBottom="1px"
        borderBottomColor="gray.100"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="white"
      >
        <Heading
          as="h2"
          size="md"
          textOverflow="ellipsis"
          maxWidth="60%"
          overflow="hidden"
          whiteSpace="nowrap"
        >
          {heading}
        </Heading>
        <Stack
          direction="row"
          as="nav"
          spacing={4}
          display={["none", "none", "flex", "flex"]}
        >
          <TopRightNewLinkPopover />
          <TopRightViewPicker />
          <TopRightUserMenu />
        </Stack>
        <Stack
          direction="row"
          as="nav"
          spacing={4}
          display={["flex", "flex", "none", "none"]}
        >
          <TopRightNewLinkPopover />
          <IconButton
            ref={buttonRef}
            onClick={onOpen}
            aria-label="nav"
            icon={<HamburgerIcon />}
          />
        </Stack>
      </Flex>
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        finalFocusRef={buttonRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <Sidebar />
        </DrawerContent>
      </Drawer>
    </Container>
  );
}
