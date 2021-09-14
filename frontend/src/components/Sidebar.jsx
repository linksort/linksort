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
import { CopyIcon, StarIcon, UpDownIcon } from "@chakra-ui/icons";

import Logo from "./Logo";
import MouseType from "./MouseType";
import SidebarButton from "./SidebarButton";
import SidebarSearchButton from "./SidebarSearchButton";
import SidebarFolderTree from "./SidebarFolderTree";
import { useFilters } from "../hooks/filters";

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
  const {
    handleToggleSort,
    handleToggleGroup,
    makeToggleFavoritesLink,
    sortDirection,
    groupName,
    areFavoritesShowing,
  } = useFilters();

  return (
    <Box position="fixed" minHeight="100vh" width="16rem" zIndex={2}>
      <Flex
        as="header"
        height="5rem"
        justifyContent="flex-start"
        alignItems="center"
        marginBottom={4}
      >
        <RouterLink to="/">
          <Logo />
          <VisuallyHidden>Linksort</VisuallyHidden>
        </RouterLink>
      </Flex>
      <List paddingRight={6}>
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
        <ListItem>
          <SidebarSectionHeader>Folders</SidebarSectionHeader>
          <SidebarFolderTree />
        </ListItem>
      </List>
      <Box position="absolute" bottom="0" left="0" paddingY={4}>
        <MouseType align="left" color="gray.600" fontSize="xs" />
      </Box>
    </Box>
  );
}
