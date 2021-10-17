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

export default function Sidebar() {
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
      width="18rem"
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
            marginBottom={[2, 2, 4, 4]}
          >
            <RouterLink to="/">
              <Logo />
              <VisuallyHidden>Linksort</VisuallyHidden>
            </RouterLink>
          </Flex>
          <Box display={["block", "block", "none", "none"]} marginBottom={6}>
            <TopRightViewPicker />
          </Box>
          <List paddingRight={2}>
            <ListItem marginBottom={8}>
              <Stack as={List} spacing={1}>
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
            <ListItem marginBottom={8}>
              <SidebarSectionHeader>Folders</SidebarSectionHeader>
              <SidebarFolderTree />
            </ListItem>
            <ListItem>
              <SidebarSectionHeader>Auto Tags</SidebarSectionHeader>
              <SidebarTagTree />
            </ListItem>
            <ListItem
              marginTop={8}
              display={["list-item", "list-item", "none", "none"]}
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
        <Box paddingY={4}>
          <MouseType align="left" color="gray.600" fontSize="xs" />
        </Box>
      </Flex>
    </Box>
  );
}
