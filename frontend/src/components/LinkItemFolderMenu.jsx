import React, { useState } from "react";
import {
  Menu,
  MenuList,
  MenuItem,
  MenuDivider,
  Portal,
  Text,
} from "@chakra-ui/react";
import {
  CloseIcon,
  CheckCircleIcon,
  ArrowBackIcon,
  AddIcon,
} from "@chakra-ui/icons";

import { FolderIcon } from "./CustomIcons";

function bfs(folderTree, defaultReturn, cb) {
  const queue = [...folderTree.children];

  while (queue.length > 0) {
    let node = queue.shift();

    let found = cb(node);
    if (found) {
      return found;
    }

    queue.push(...node.children);
  }

  return defaultReturn;
}

function findParent(folderTree, target) {
  return bfs(folderTree, folderTree, (node) => {
    for (let i = 0; i < node.children.length; i++) {
      if (node.children[i].id === target.id) {
        return node;
      }
    }
  });
}

function findFolderName(folderTree, id) {
  return bfs(folderTree, "root", (node) => {
    if (node.id === id) {
      return node.name;
    }
  });
}

export default function LinkItemFolderMenu({
  link,
  buttonSlot,
  folderTree,
  isLinkInFolder,
  onMoveToFolder,
}) {
  const [selectedFolder, setSelectedFolder] = useState(folderTree);
  const isSelectedFolderRoot = selectedFolder.id === "root";
  const currentFolderName = isLinkInFolder
    ? findFolderName(folderTree, link.folderId)
    : "";

  function handleClick(folder) {
    if (folder.children.length > 0) {
      setSelectedFolder(folder);
    } else {
      onMoveToFolder(folder.id);
    }
  }

  function handleBackClick() {
    setSelectedFolder(findParent(folderTree, selectedFolder));
  }

  return (
    <Menu>
      {buttonSlot}
      <Portal>
        <MenuList maxWidth="90vw">
          {!isSelectedFolderRoot && (
            <>
              <MenuItem
                onClick={() => onMoveToFolder(selectedFolder.id)}
                icon={<AddIcon />}
              >
                Add to Folder:{" "}
                <Text as="span" fontWeight="medium">
                  {selectedFolder.name}
                </Text>
              </MenuItem>
              <MenuDivider />
            </>
          )}

          {selectedFolder.children.map((folder) => (
            <MenuItem
              key={folder.id}
              onClick={() => handleClick(folder)}
              icon={<FolderIcon />}
              closeOnSelect={false}
            >
              {folder.name}{" "}
              {folder.id === link.folderId && <CheckCircleIcon ml={2} />}
            </MenuItem>
          ))}

          {!isSelectedFolderRoot && (
            <>
              <MenuDivider />
              <MenuItem
                onClick={handleBackClick}
                icon={<ArrowBackIcon />}
                closeOnSelect={false}
              >
                Back
              </MenuItem>
            </>
          )}

          {isLinkInFolder && isSelectedFolderRoot && (
            <>
              <MenuDivider />
              <MenuItem
                key="none"
                onClick={() => onMoveToFolder("root")}
                icon={<CloseIcon />}
              >
                Remove from Folder:{" "}
                <Text as="span" fontWeight="medium">
                  {currentFolderName}
                </Text>
              </MenuItem>
            </>
          )}
        </MenuList>
      </Portal>
    </Menu>
  );
}
