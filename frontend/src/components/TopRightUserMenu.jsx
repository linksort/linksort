import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Text,
  MenuDivider,
} from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";

import TopRightViewPicker from "./TopRightViewPicker";
import { useSignOut } from "../hooks/auth";

export default function TopRightUserMenu({ isMobile }) {
  const signOutMutation = useSignOut();

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        className={isMobile ? "js-user-menu-mobile" : "js-user-menu"}
        aria-label="Options"
        icon={<SettingsIcon />}
        variant="solid"
        borderLeftRadius={isMobile ? "none" : "default"}
      />
      <MenuList>
        <MenuItem
          closeOnSelect={false}
          as="div"
          _hover={{ background: "unset" }}
          _focus={{ background: "unset" }}
          justifyContent="left"
        >
          <TopRightViewPicker />
        </MenuItem>

        <MenuDivider />

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

        <MenuDivider />

        <MenuItem>
          <Text as={RouterLink} to="/account" width="100%">
            Manage account
          </Text>
        </MenuItem>
        <MenuItem onClick={signOutMutation.mutate}>Sign out</MenuItem>
      </MenuList>
    </Menu>
  );
}
