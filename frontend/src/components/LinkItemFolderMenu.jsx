import React from "react";
import { Menu, MenuList, MenuItem } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

import { FolderIcon } from "./CustomIcons";

export default function LinkItemFolderMenu({
  buttonSlot,
  folderTree,
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
            {folder.name}
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
  );
}
