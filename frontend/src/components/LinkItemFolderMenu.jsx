import React from "react";
import { Menu, MenuList, MenuItem } from "@chakra-ui/react";
import { CloseIcon, CheckCircleIcon } from "@chakra-ui/icons";

import { FolderIcon } from "./CustomIcons";

export default function LinkItemFolderMenu({
  link,
  buttonSlot,
  folderTree,
  isLinkInFolder,
  onMoveToFolder,
}) {
  return (
    <Menu>
      {buttonSlot}
      <MenuList>
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
        {isLinkInFolder && (
          <MenuItem
            key="none"
            onClick={() => onMoveToFolder("root")}
            icon={<CloseIcon />}
          >
            Remove from folder
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
}
