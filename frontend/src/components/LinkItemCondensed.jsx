import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import {
  DeleteIcon,
  EditIcon,
  StarIcon,
  CloseIcon,
  CheckCircleIcon,
} from "@chakra-ui/icons";

import LinkItemFavicon from "./LinkItemFavicon";
import { DotDotDotVert, FolderIcon, StarBorderIcon } from "./CustomIcons";

export default function LinkItemCondensed({
  link,
  folderTree,
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
      <Menu>
        <MenuButton>
          <DotDotDotVert />
        </MenuButton>
        <MenuList>
          <MenuItem
            icon={link.isFavorite ? <StarIcon /> : <StarBorderIcon />}
            onClick={onToggleIsFavorite}
          >
            Favorite
          </MenuItem>
          <MenuItem
            icon={<EditIcon />}
            as={RouterLink}
            to={`/links/${link.id}`}
          >
            Edit
          </MenuItem>
          <MenuItem icon={<DeleteIcon />} onClick={onDeleteLink}>
            Delete
          </MenuItem>
          <MenuDivider />
          {folderTree.children.map((folder) => (
            <MenuItem
              key={folder.id}
              onClick={() => onMoveToFolder(folder.id)}
              icon={<FolderIcon />}
            >
              {folder.name}{" "}
              {folder.id === link.folderId && <CheckCircleIcon ml={2} />}
            </MenuItem>
          ))}
          <MenuItem
            key="none"
            onClick={() => onMoveToFolder("root")}
            icon={<CloseIcon />}
          >
            Remove from folder
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}
