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
  Tooltip,
} from "@chakra-ui/react";
import { HamburgerIcon, ChatIcon } from "@chakra-ui/icons";
import { useParams, useRouteMatch } from "react-router-dom";

import TopRightUserMenu from "./TopRightUserMenu";
import TopRightNewLinkPopover from "./TopRightNewLinkPopover";
import { HEADER_HEIGHT, HEADER_HEIGHT_MOBILE } from "../theme/theme";
import { useFilters } from "../hooks/filters";
import { useLink } from "../hooks/links";
import Sidebar from "./Sidebar";
import ChatSidepanel from "./ChatSidepanel"
import GiveFeedbackButton from "./GiveFeedbackButton";
import { useScrollPosition } from "../hooks/utils";
import { useChatContext } from "../hooks/chat";

export default function Header({ isChatVisible, onToggleChat }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const buttonRef = useRef();
  const {
    isChatDrawerOpen: isChatOpen,
    openChatDrawer: onChatOpen,
    closeChatDrawer: onChatClose,
  } = useChatContext();
  const chatButtonRef = useRef();
  const { folderName, areFavoritesShowing, searchQuery, tagPath, userTagPath } =
    useFilters();
  const isSearching = searchQuery && searchQuery.length > 0;
  const isViewingTag = tagPath.length > 0;
  const isViewingUserTag = userTagPath.length > 0;
  const rootMatch = useRouteMatch({
    path: "/",
    strict: true,
    sensitive: true
  })
  const graphMatch = useRouteMatch("/graph")
  const accountMatch = useRouteMatch("/account")

  const { linkId } = useParams();
  const {
    data: link = { title: "" },
  } = useLink(linkId, {
    enabled: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const scrollPosition = useScrollPosition()

  let opacity = "1"
  if (linkId) {
    opacity = scrollPosition > 400 ? "1" : "0"
  }
  const quietButton = {
    variant: "ghost",
    colorScheme: "gray",
    size: "sm",
  }

  let heading = linkId && scrollPosition > 200 ? link.title : ""
  if (graphMatch) {
    heading = "Graph"
  } else if (accountMatch) {
    heading = "Account"
  } else if (rootMatch.isExact) {
    if (isSearching && areFavoritesShowing) {
      heading = `Searching for "${searchQuery}" among favorites in ${folderName}`;
    } else if (isSearching) {
      heading = `Searching for "${searchQuery}" in ${folderName}`;
    } else if (areFavoritesShowing) {
      heading = `Favorites in ${isViewingTag ? tagPath : folderName}`;
    } else if (isViewingUserTag) {
      heading = userTagPath;
    } else {
      heading = isViewingTag ? tagPath : folderName;
    }
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
        isChatVisible ? "calc(100vw - 18rem - 25rem)" : "calc(100vw - 18rem)",
      ]}
    >
      <Flex
        width="100%"
        marginX="auto"
        maxWidth="5xl"
        paddingX={[4, 4, 4, 4, 6]}
        height={[HEADER_HEIGHT_MOBILE, HEADER_HEIGHT_MOBILE, HEADER_HEIGHT_MOBILE, HEADER_HEIGHT_MOBILE, HEADER_HEIGHT]}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="white"
      >
        <HStack maxWidth={[
          "calc(100% - 12rem)",
          "calc(100% - 12rem)",
          "calc(100% - 12rem)",
          "calc(100% - 16rem)",
          "calc(100% - 19rem)",
          "calc(100% - 19rem)",
        ]}>
          <Heading
            as="h2"
            fontSize="lg"
            letterSpacing="-0.01em"
            textOverflow="ellipsis"
            maxWidth="100%"
            overflow="hidden"
            whiteSpace="nowrap"
            title={heading}
            transition="opacity 0.2s ease"
            opacity={opacity}
          >
            {heading}
          </Heading>
        </HStack>

        <Stack
          direction="row"
          as="nav"
          spacing={2}
          alignItems="center"
          display={["none", "none", "none", "none", "flex"]}
        >
          <TopRightNewLinkPopover />
          <GiveFeedbackButton>
            <Button as="span" {...quietButton} color="gray.600" fontWeight="medium" fontSize="sm">
              Feedback
            </Button>
          </GiveFeedbackButton>
          <Tooltip label={isChatVisible ? "Hide chat" : "Show chat"} openDelay={400}>
            <IconButton
              display={["none", "none", "none", "none", "none", "flex"]}
              onClick={onToggleChat}
              aria-label={isChatVisible ? "Hide chat" : "Show chat"}
              zIndex={10}
              icon={<ChatIcon />}
              {...quietButton}
              bg={isChatVisible ? "gray.100" : "transparent"}
            />
          </Tooltip>
          <IconButton
            display={["flex", "flex", "flex", "flex", "flex", "none"]}
            id="mobile-nav"
            ref={chatButtonRef}
            onClick={onChatOpen}
            aria-label="Open chat"
            zIndex={10}
            icon={<ChatIcon />}
            {...quietButton}
          />
          <TopRightUserMenu />
        </Stack>
        <Stack
          direction="row"
          as="nav"
          spacing={1}
          alignItems="center"
          display={["flex", "flex", "flex", "flex", "none"]}
        >
          <TopRightNewLinkPopover isMobile={true} />
          <IconButton
            id="mobile-nav"
            display={["flex", "flex", "flex", "flex", "none"]}
            ref={buttonRef}
            onClick={onOpen}
            aria-label="Open menu"
            zIndex={10}
            icon={<HamburgerIcon />}
            {...quietButton}
          />
          <IconButton
            id="mobile-nav"
            display={["flex", "flex", "flex", "flex", "none"]}
            ref={chatButtonRef}
            onClick={onChatOpen}
            aria-label="Open chat"
            zIndex={10}
            icon={<ChatIcon />}
            {...quietButton}
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

      <Drawer
        isOpen={isChatOpen}
        placement="right"
        onClose={onChatClose}
        finalFocusRef={chatButtonRef}
        autoFocus={false}
      >
        <DrawerOverlay />
        <DrawerContent>
          <ChatSidepanel />
        </DrawerContent>
      </Drawer>

    </Box>
  );
}
