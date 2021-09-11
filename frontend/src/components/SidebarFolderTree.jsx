import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { List, ListItem, Stack } from "@chakra-ui/react";
import { AddIcon, HamburgerIcon } from "@chakra-ui/icons";

import SidebarButton from "./SidebarButton";
import { useFilterParams } from "../hooks/filters";

export default function SidebarFolderTree() {
  const { folder } = useFilterParams();

  return (
    <Stack as={List} spacing={1}>
      <ListItem>
        <SidebarButton
          variant={folder === "All" ? "solid" : "ghost"}
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
    </Stack>
  );
}
