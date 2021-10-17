import React from "react";
import { Flex, Link } from "@chakra-ui/react";

import LinkItemFavicon from "./LinkItemFavicon";
import LinkItemControls from "./LinkItemControls";

export default function LinkItemCondensed({
  link,
  folderTree,
  isLinkInFolder,
  currentFolderName,
  onDeleteLink,
  onToggleIsFavorite,
  onMoveToFolder,
}) {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      height={10}
      backgroundColor="gray.50"
      borderBottomColor="gray.200"
      borderBottomStyle="solid"
      borderBottomWidth={1}
      paddingX={2}
      maxWidth="92ch"
      width="100%"
      overflow="hidden"
      _hover={{
        backgroundColor: "gray.100",
      }}
      transition="ease 200ms"
    >
      <Flex overflow="hidden">
        <LinkItemFavicon favicon={link.favicon} />
        <Link
          href={link.url}
          borderRadius="sm"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          isExternal
        >
          {link.title}
        </Link>
      </Flex>
      <LinkItemControls
        link={link}
        folderTree={folderTree}
        isLinkInFolder={isLinkInFolder}
        currentFolderName={currentFolderName}
        onDeleteLink={onDeleteLink}
        onToggleIsFavorite={onToggleIsFavorite}
        onMoveToFolder={onMoveToFolder}
        buttonSpacing="none"
        buttonColor="transparent"
        buttonFolderIconPlacement="right"
      />
    </Flex>
  );
}
