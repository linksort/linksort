import React, { useRef } from "react";
import {
  Stack,
  Heading,
  Flex,
  Box,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  Button,
  HStack,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

import TopRightUserMenu from "./TopRightUserMenu";
import TopRightNewLinkPopover from "./TopRightNewLinkPopover";
import { HEADER_HEIGHT } from "../theme/theme";
import { useFilters } from "../hooks/filters";
import Sidebar from "./Sidebar";
import GiveFeedbackButton from "./GiveFeedbackButton";

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const buttonRef = useRef();
  const { folderName, areFavoritesShowing, searchQuery, tagPath } =
    useFilters();
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
    <Box
      borderBottom="1px"
      borderBottomColor="gray.100"
      width="100%"
      backgroundColor="white"
      maxWidth={[
        "calc(100vw)",
        "calc(100vw)",
        "calc(100vw)",
        "calc(100vw)",
        "calc(100vw - 18rem)",
      ]}
    >
      <Flex
        width="100%"
        marginX="auto"
        maxWidth="5xl"
        paddingX={6}
        height={HEADER_HEIGHT}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="white"
      >
        <HStack maxWidth="60%">
          <Heading
            as="h2"
            size="md"
            textOverflow="ellipsis"
            maxWidth="100%"
            overflow="hidden"
            whiteSpace="nowrap"
          >
            {heading}
          </Heading>
        </HStack>

        <Stack
          direction="row"
          as="nav"
          spacing={4}
          display={["none", "none", "none", "none", "flex"]}
        >
          <TopRightNewLinkPopover />
          <GiveFeedbackButton>
            <Button>Give Feedback</Button>
          </GiveFeedbackButton>
          <TopRightUserMenu />
        </Stack>
        <Stack
          direction="row"
          as="nav"
          spacing={0}
          display={["flex", "flex", "flex", "flex", "none"]}
        >
          <TopRightNewLinkPopover isMobile={true} />
          <IconButton
            id="mobile-nav"
            display={["flex", "flex", "flex", "flex", "none"]}
            borderRadius="none"
            ref={buttonRef}
            onClick={onOpen}
            aria-label="nav"
            zIndex={10}
            icon={<HamburgerIcon />}
          />
          <TopRightUserMenu isMobile={true} />
        </Stack>
      </Flex>
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        finalFocusRef={buttonRef}
        autoFocus={false}
      >
        <DrawerOverlay />
        <DrawerContent>
          <Sidebar width="100%" isMobile={true} />
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
