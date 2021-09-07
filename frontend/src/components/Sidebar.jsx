import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  List,
  ListItem,
  Button,
  Heading,
  Box,
  VisuallyHidden,
  Text,
} from "@chakra-ui/react";
import {
  AddIcon,
  CopyIcon,
  HamburgerIcon,
  StarIcon,
  UpDownIcon,
} from "@chakra-ui/icons";

import Logo from "./Logo";
import MouseType from "./MouseType";
import SidebarSearchButton from "./SidebarSearchButton";
import { useSortBy, useGroupBy, useFavorites } from "../hooks/filters";

function SidebarButton(props) {
  return (
    <Button
      variant="ghost"
      width="100%"
      justifyContent="flex-start"
      paddingLeft="0.5rem"
      marginLeft="-0.5rem"
      color="gray.800"
      fontWeight="medium"
      letterSpacing="0.01rem"
      {...props}
    />
  );
}

function SidebarSectionHeader({ children, ...rest }) {
  return (
    <Heading
      as="h4"
      fontSize="0.7rem"
      fontWeight="bold"
      color="gray.600"
      textTransform="uppercase"
      {...rest}
    >
      {children}
    </Heading>
  );
}

export default function Sidebar() {
  const { toggleSort, sortValue } = useSortBy();
  const { toggleGroup, groupValue } = useGroupBy();
  const { toggleFavorites, favoriteValue } = useFavorites();

  return (
    <Box position="fixed" minHeight="100vh" width="16rem">
      <Flex
        as="header"
        height="5rem"
        justifyContent="flex-start"
        alignItems="center"
        marginBottom={6}
      >
        <RouterLink to="/">
          <Logo />
          <VisuallyHidden>Linksort</VisuallyHidden>
        </RouterLink>
      </Flex>
      <List paddingRight={6}>
        <ListItem>
          <SidebarSectionHeader>Filter & Sort</SidebarSectionHeader>
          <List marginY={5}>
            <ListItem>
              <SidebarSearchButton />
            </ListItem>
            <ListItem>
              <SidebarButton leftIcon={<UpDownIcon />} onClick={toggleSort}>
                <Text as="span">
                  Sort by{" "}
                  <Text as="span" color="gray.600">
                    {sortValue}
                  </Text>
                </Text>
              </SidebarButton>
            </ListItem>
            <ListItem>
              <SidebarButton leftIcon={<CopyIcon />} onClick={toggleGroup}>
                <Text as="span">
                  Group by{" "}
                  <Text as="span" color="gray.600">
                    {groupValue}
                  </Text>
                </Text>
              </SidebarButton>
            </ListItem>
            <ListItem>
              <SidebarButton
                leftIcon={<StarIcon />}
                onClick={toggleFavorites}
                variant={favoriteValue ? "solid" : "ghost"}
              >
                Favorites
              </SidebarButton>
            </ListItem>
          </List>
        </ListItem>
        <ListItem>
          <SidebarSectionHeader>Folders</SidebarSectionHeader>
          <List marginY={5}>
            <ListItem>
              <SidebarButton
                as={RouterLink}
                to="/"
                leftIcon={<HamburgerIcon />}
              >
                All
              </SidebarButton>
            </ListItem>
            <ListItem>
              <SidebarButton leftIcon={<AddIcon />}>New folder</SidebarButton>
            </ListItem>
          </List>
        </ListItem>
      </List>
      <Box position="absolute" bottom="0" left="0" paddingY={4}>
        <MouseType align="left" color="gray.600" fontSize="xs" />
      </Box>
    </Box>
  );
}
