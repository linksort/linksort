import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { DeleteIcon, StarIcon, LinkIcon, ViewIcon } from "@chakra-ui/icons";

import LinkItemFavicon from "./LinkItemFavicon";
import LinkItemFolderMenuList from "./LinkItemFolderMenuList";
import { DotDotDotVert, FolderIcon, StarBorderIcon } from "./CustomIcons";

export default function LinkItemCondensed({
  link,
  folderTree,
  isLinkInFolder,
  onDeleteLink,
  onToggleIsFavorite,
  onMoveToFolder,
  onCopyLink,
}) {
  const [isInFolderMode, setIsInFolderMode] = useState(false);

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
      maxWidth={["100%", "100%", "100%", "100%", "calc(100% - 2rem)", "100%"]}
      width="100%"
      flexGrow={0}
      overflow="hidden"
      transition="ease 200ms"
      borderLeft="3px solid transparent"
      _focusWithin={{
        borderLeft: "3px solid #80a9ff",
      }}
      _hover={{
        backgroundColor: "gray.100",
      }}
    >
      <Flex overflow="hidden">
        <LinkItemFavicon favicon={link.favicon} />
        <Link
          href={link.url}
          borderRadius="sm"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          _focus="none"
          isExternal
        >
          {link.title}
        </Link>
      </Flex>
      <Menu isLazy>
        <MenuButton>
          <DotDotDotVert />
        </MenuButton>
        <Portal>
          {isInFolderMode ? (
            <LinkItemFolderMenuList
              link={link}
              folderTree={folderTree}
              isLinkInFolder={isLinkInFolder}
              onMoveToFolder={onMoveToFolder}
              onBack={() => setIsInFolderMode(false)}
            />
          ) : (
            <MenuList>
              <MenuItem
                icon={link.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                onClick={onToggleIsFavorite}
              >
                Favorite
              </MenuItem>
              <MenuItem icon={<LinkIcon />} onClick={onCopyLink}>
                Copy link
              </MenuItem>
              <MenuItem
                icon={<ViewIcon />}
                as={RouterLink}
                to={`/links/${link.id}`}
              >
                View
              </MenuItem>
              <MenuItem icon={<DeleteIcon />} onClick={onDeleteLink}>
                Delete
              </MenuItem>
              <MenuItem
                icon={<FolderIcon />}
                onClick={() => setIsInFolderMode(true)}
                closeOnSelect={false}
              >
                Folders
              </MenuItem>
            </MenuList>
          )}
        </Portal>
      </Menu>
    </Flex>
  );
}
