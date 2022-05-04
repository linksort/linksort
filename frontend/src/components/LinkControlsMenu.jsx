import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuList, Portal } from "@chakra-ui/react";
import { DeleteIcon, StarIcon, LinkIcon, ViewIcon } from "@chakra-ui/icons";

import LinkItemFolderMenuList from "./LinkItemFolderMenuList";
import { FolderIcon, StarBorderIcon } from "./CustomIcons";
import { useFolders } from "../hooks/folders";
import { useLinkOperations } from "../hooks/links";

export default function LinkControlsMenu({ link, buttonSlot }) {
  const {
    handleDeleteLink,
    handleToggleIsFavorite,
    handleMoveToFolder,
    handleCopyLink,
  } = useLinkOperations(link);
  const { folderTree } = useFolders();
  const isLinkInFolder = link.folderId !== "root" && link.folderId.length > 0;
  const [isInFolderMode, setIsInFolderMode] = useState(false);

  return (
    <Menu isLazy>
      <MenuButton>{buttonSlot}</MenuButton>
      <Portal>
        {isInFolderMode ? (
          <LinkItemFolderMenuList
            link={link}
            folderTree={folderTree}
            isLinkInFolder={isLinkInFolder}
            onMoveToFolder={handleMoveToFolder}
            onBack={() => setIsInFolderMode(false)}
          />
        ) : (
          <MenuList>
            <MenuItem
              icon={link.isFavorite ? <StarIcon /> : <StarBorderIcon />}
              onClick={handleToggleIsFavorite}
            >
              Favorite
            </MenuItem>
            <MenuItem icon={<LinkIcon />} onClick={handleCopyLink}>
              Copy link
            </MenuItem>
            <MenuItem
              icon={<ViewIcon />}
              as={RouterLink}
              to={`/links/${link.id}`}
            >
              View
            </MenuItem>
            <MenuItem icon={<DeleteIcon />} onClick={handleDeleteLink}>
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
  );
}
