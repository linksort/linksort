import React from "react";
import { List, ListItem, Button, Heading } from "@chakra-ui/react";
import {
  AddIcon,
  CopyIcon,
  HamburgerIcon,
  Search2Icon,
  StarIcon,
  UpDownIcon,
} from "@chakra-ui/icons";

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

export default function Sidebar(props) {
  return (
    <List paddingRight={6}>
      <ListItem>
        <SidebarSectionHeader>Filter & Sort</SidebarSectionHeader>
        <List marginY={4}>
          <ListItem>
            <SidebarButton leftIcon={<Search2Icon />}>Search</SidebarButton>
          </ListItem>
          <ListItem>
            <SidebarButton leftIcon={<UpDownIcon />}>Sort by</SidebarButton>
          </ListItem>
          <ListItem>
            <SidebarButton leftIcon={<CopyIcon />}>Group by</SidebarButton>
          </ListItem>
          <ListItem>
            <SidebarButton leftIcon={<StarIcon />}>Favorites</SidebarButton>
          </ListItem>
        </List>
      </ListItem>
      <ListItem>
        <SidebarSectionHeader>Folders</SidebarSectionHeader>
        <List marginY={4}>
          <ListItem>
            <SidebarButton leftIcon={<HamburgerIcon />}>All</SidebarButton>
          </ListItem>
          <ListItem>
            <SidebarButton leftIcon={<AddIcon />}>New folder</SidebarButton>
          </ListItem>
        </List>
      </ListItem>
    </List>
  );
}
