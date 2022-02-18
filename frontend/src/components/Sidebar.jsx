import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  List,
  ListItem,
  Box,
  VisuallyHidden,
  Text,
  Stack,
} from "@chakra-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  StarIcon,
} from "@chakra-ui/icons";

import Logo from "./Logo";
import MouseType from "./MouseType";
import SidebarButton from "./SidebarButton";
import SidebarCollapsableSection from "./SidebarCollapsableSection";
import SidebarSearchButton from "./SidebarSearchButton";
import SidebarFolderTree from "./SidebarFolderTree";
import SidebarTagTree from "./SidebarTagTree";
import { useFilters } from "../hooks/filters";
import { StarBorderIcon } from "./CustomIcons";

export default function Sidebar({ width = "18rem", isMobile = false }) {
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
            marginBottom={2}
          >
            <RouterLink to="/">
              <Logo />
              <VisuallyHidden>Linksort</VisuallyHidden>
            </RouterLink>
          </Flex>
          <Box as="nav">
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
                      leftIcon={
                        sortDirection === "newest first" ? (
                          <ArrowDownIcon />
                        ) : (
                          <ArrowUpIcon />
                        )
                      }
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
                      leftIcon={
                        areFavoritesShowing ? <StarIcon /> : <StarBorderIcon />
                      }
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
                <SidebarCollapsableSection title="Folders">
                  <SidebarFolderTree />
                </SidebarCollapsableSection>
              </ListItem>
              <ListItem
                id={isMobile ? "mobile-auto-tag-controls" : "auto-tag-controls"}
              >
                <SidebarCollapsableSection title="Auto Tags">
                  <SidebarTagTree />
                </SidebarCollapsableSection>
              </ListItem>
            </List>
          </Box>
        </Box>
        <Box paddingBottom={[16, 16, 4, 4, 4]} paddingTop={10}>
          <MouseType align="left" color="gray.600" fontSize="xs" />
        </Box>
      </Flex>
    </Box>
  );
}
