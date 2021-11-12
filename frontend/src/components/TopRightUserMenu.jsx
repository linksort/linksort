import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Link,
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
          <Link href="/blog" isExternal width="100%">
            Blog
          </Link>
        </MenuItem>
        <MenuItem>
          <RouterLink to="/extensions">Browser extension</RouterLink>
        </MenuItem>
        <MenuItem onClick={signOutMutation.mutate}>Sign out</MenuItem>
      </MenuList>
    </Menu>
  );
}
