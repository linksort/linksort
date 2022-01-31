import React from "react";
import { Menu, Portal } from "@chakra-ui/react";

import LinkItemFolderMenuList from "./LinkItemFolderMenuList";

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
      <Portal>
        <LinkItemFolderMenuList
          link={link}
          folderTree={folderTree}
          isLinkInFolder={isLinkInFolder}
          onMoveToFolder={onMoveToFolder}
        />
      </Portal>
    </Menu>
  );
}
