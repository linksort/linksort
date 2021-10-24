import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  List,
  ListItem,
  Heading,
  Box,
  VisuallyHidden,
  Text,
  Stack,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  CopyIcon,
  StarIcon,
  UpDownIcon,
} from "@chakra-ui/icons";

import Logo from "./Logo";
import MouseType from "./MouseType";
import SidebarButton from "./SidebarButton";
import SidebarSearchButton from "./SidebarSearchButton";
import SidebarFolderTree from "./SidebarFolderTree";
import SidebarTagTree from "./SidebarTagTree";
import TopRightViewPicker from "./TopRightViewPicker";
import { useFilters } from "../hooks/filters";
import { useSignOut } from "../hooks/auth";

function SidebarSectionHeader({ children, ...rest }) {
  return (
    <Heading
      as="h4"
      fontSize="0.7rem"
      fontWeight="bold"
      color="gray.600"
      textTransform="uppercase"
      marginBottom={4}
      {...rest}
    >
      {children}
    </Heading>
  );
}

export default function Sidebar({ width = "18rem", isMobile = false }) {
  const signOutMutation = useSignOut();
  const {
    handleToggleSort,
    handleToggleGroup,
    makeToggleFavoritesLink,
    sortDirection,
    groupName,
    areFavoritesShowing,
  } = useFilters();

  return (
    <Box
      position="fixed"
      minHeight="100vh"
      height="100%"
      width={width}
      paddingLeft={4}
      zIndex={2}
      overflowY="scroll"
    >
      <Flex direction="column" justifyContent="space-between" minHeight="100vh">
        <Box>
          <Flex
            as="header"
            height="5rem"
            justifyContent="flex-start"
            alignItems="center"
            marginBottom={[2, 2, 2, 2, 4]}
          >
            <RouterLink to="/">
              <Logo />
              <VisuallyHidden>Linksort</VisuallyHidden>
            </RouterLink>
          </Flex>
          <Box marginBottom={6}>
            <TopRightViewPicker isMobile={isMobile} />
          </Box>
          <List paddingRight={2}>
            <ListItem marginBottom={8}>
              <Stack
                as={List}
                spacing={1}
                id={isMobile ? "mobile-filter-controls" : "filter-controls"}
              >
                <ListItem>
                  <SidebarSearchButton />
                </ListItem>
                <ListItem>
                  <SidebarButton
                    leftIcon={<UpDownIcon />}
                    onClick={handleToggleSort}
                  >
                    <Text as="span">
                      Sort by{" "}
                      <Text as="span" color="gray.600">
                        {sortDirection}
                      </Text>
                    </Text>
                  </SidebarButton>
                </ListItem>
                <ListItem>
                  <SidebarButton
                    leftIcon={<CopyIcon />}
                    onClick={handleToggleGroup}
                  >
                    <Text as="span">
                      Group by{" "}
                      <Text as="span" color="gray.600">
                        {groupName}
                      </Text>
                    </Text>
                  </SidebarButton>
                </ListItem>
                <ListItem>
                  <SidebarButton
                    leftIcon={<StarIcon />}
                    as={RouterLink}
                    to={makeToggleFavoritesLink()}
                    variant={areFavoritesShowing ? "solid" : "ghost"}
                  >
                    Favorites
                  </SidebarButton>
                </ListItem>
              </Stack>
            </ListItem>
            <ListItem
              marginBottom={8}
              id={isMobile ? "mobile-folder-controls" : "folder-controls"}
            >
              <SidebarSectionHeader>Folders</SidebarSectionHeader>
              <SidebarFolderTree />
            </ListItem>
            <ListItem
              id={isMobile ? "mobile-auto-tag-controls" : "auto-tag-controls"}
            >
              <SidebarSectionHeader>Auto Tags</SidebarSectionHeader>
              <SidebarTagTree />
            </ListItem>
            <ListItem
              marginTop={8}
              display={[
                "list-item",
                "list-item",
                "list-item",
                "list-item",
                "none",
              ]}
            >
              <SidebarButton
                leftIcon={<ArrowBackIcon />}
                onClick={signOutMutation.mutate}
              >
                Sign out
              </SidebarButton>
            </ListItem>
          </List>
        </Box>
        <Box paddingBottom={[16, 16, 16, 16, 4]} paddingTop={4}>
          <MouseType align="left" color="gray.600" fontSize="xs" />
        </Box>
      </Flex>
    </Box>
  );
}
