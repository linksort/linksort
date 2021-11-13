import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";

import { useSignOut } from "../hooks/auth";

export default function TopRightUserMenu() {
  const signOutMutation = useSignOut();

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Options"
        icon={<SettingsIcon />}
        variant="solid"
      />
      <MenuList>
        <MenuItem>
          <Text as="a" href="/blog" target="_blank" width="100%">
            Blog
          </Text>
        </MenuItem>
        <MenuItem>
          <Text as={RouterLink} to="/extensions" width="100%">
            Browser extension
          </Text>
        </MenuItem>
        <MenuItem onClick={signOutMutation.mutate}>Sign out</MenuItem>
      </MenuList>
    </Menu>
  );
}
