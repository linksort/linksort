import React, { useEffect, useState } from "react";
import { MenuList, MenuItem, MenuDivider, Text } from "@chakra-ui/react";
import {
  CheckCircleIcon,
  ArrowBackIcon,
  AddIcon,
  SmallCloseIcon,
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

export default function LinkItemFolderMenuList({
  link,
  folderTree,
  isLinkInFolder,
  onMoveToFolder,
  onBack,
}) {
  const [selectedFolder, setSelectedFolder] = useState(folderTree);
  const isSelectedFolderRoot = selectedFolder.id === "root";
  const currentFolderName = isLinkInFolder
    ? findFolderName(folderTree, link.folderId)
    : "";

  useEffect(() => {
    setSelectedFolder(folderTree);
  }, [folderTree]);

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
    <MenuList maxWidth="90vw">
      {!isSelectedFolderRoot && (
        <>
          <MenuItem
            onClick={() => onMoveToFolder(selectedFolder.id)}
            icon={<AddIcon />}
            closeOnSelect={false}
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

      {isLinkInFolder && isSelectedFolderRoot && currentFolderName !== "root" && (
        <>
          <MenuDivider />
          <MenuItem
            key="none"
            onClick={() => onMoveToFolder("root")}
            icon={<SmallCloseIcon />}
            closeOnSelect={false}
          >
            Remove from Folder:{" "}
            <Text as="span" fontWeight="medium">
              {currentFolderName}
            </Text>
          </MenuItem>
        </>
      )}

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

      {isSelectedFolderRoot && selectedFolder.children.length === 0 && (
        <MenuItem disabled>
          <Text color="gray.700" fontSize="sm">
            You haven't added any folders yet
          </Text>
        </MenuItem>
      )}

      {onBack && isSelectedFolderRoot && (
        <>
          <MenuDivider />
          <MenuItem
            onClick={onBack}
            icon={<ArrowBackIcon />}
            closeOnSelect={false}
          >
            Back
          </MenuItem>
        </>
      )}
    </MenuList>
  );
}
