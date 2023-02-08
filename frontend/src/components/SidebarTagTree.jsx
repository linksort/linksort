import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { List, ListItem, Stack, Text, VStack } from "@chakra-ui/react";

import { TagIcon } from "./CustomIcons";
import SidebarButton from "./SidebarButton";
import { useUser } from "../hooks/auth";
import { useFilters } from "../hooks/filters";

function SidebarTagItem({ tag }) {
  const { makeTagLink, tagPath } = useFilters();
  const isSelected = tag.path === tagPath;

  return (
    <ListItem key={tag.path}>
      <SidebarButton
        as={RouterLink}
        to={makeTagLink(tag.path)}
        variant={isSelected ? "solid" : "ghost"}
        leftIcon={<TagIcon />}
      >
        <Text as="span" overflow="hidden" textOverflow="ellipsis">
          {tag.name}
        </Text>
      </SidebarButton>
    </ListItem>
  );
}

export default function SidebarTagTree() {
  const { tagTree } = useUser();

  if (tagTree.children?.length === 0) {
    return (
      <VStack spacing={2}>
        <Text fontSize="sm" color="gray.600">
          As you save links, they will be automatically organized for you here.
        </Text>
        <Text fontSize="sm" color="gray.600">
          Drag and drop folders on top of each other to nest them.
        </Text>
      </VStack>
    );
  }

  return (
    <Stack as={List} spacing={1}>
      {tagTree.children?.map((tag) => (
        <SidebarTagItem key={tag.path} tag={tag} />
      ))}
    </Stack>
  );
}
