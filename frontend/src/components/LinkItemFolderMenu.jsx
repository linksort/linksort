import React, { useState } from "react";
import { Menu, MenuList, MenuItem, MenuDivider, Box } from "@chakra-ui/react";
import { CloseIcon, CheckCircleIcon } from "@chakra-ui/icons";

import { FolderIcon } from "./CustomIcons";

function RecursiveMenuItem({ folder, onMoveToFolder, link, depth = 0 }) {
  const [isHovering, setIsHovering] = useState(false);
  const paddingLeft = depth === 0 ? "default" : depth * 10;

  return (
    <Box
      onMouseEnter={() => setIsHovering(true)}
      key={`enclosing-box-${folder.id}`}
    >
      <MenuItem
        onClick={() => onMoveToFolder(folder.id)}
        icon={<FolderIcon />}
        paddingLeft={paddingLeft}
      >
        {folder.name}{" "}
        {folder.id === link.folderId && <CheckCircleIcon ml={2} />}
      </MenuItem>
      {isHovering && folder.children.length > 0 && (
        <MenuList border="none" boxShadow="none" paddingY="none">
          {folder.children.map((child) => (
            <RecursiveMenuItem
              key={child.id}
              folder={child}
              onMoveToFolder={onMoveToFolder}
              link={link}
              depth={depth + 1}
            />
          ))}
        </MenuList>
      )}
    </Box>
  );
}

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
          <RecursiveMenuItem
            key={folder.id}
            folder={folder}
            onMoveToFolder={onMoveToFolder}
            link={link}
          />
        ))}
        {isLinkInFolder && (
          <>
            <MenuDivider />
            <MenuItem
              key="none"
              onClick={() => onMoveToFolder("root")}
              icon={<CloseIcon />}
            >
              Remove from folder
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
}
