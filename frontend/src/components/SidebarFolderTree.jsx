import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon, HamburgerIcon } from "@chakra-ui/icons";

import { DotDotDotVert, FolderIcon } from "./CustomIcons";
import RenameFolderModal from "./RenameFolderModal";
import SidebarButton from "./SidebarButton";
import SidebarPopover from "./SidebarPopover";
import { useFilters } from "../hooks/filters";
import { useUser } from "../hooks/auth";
import { useCreateFolder, useDeleteFolder } from "../hooks/folders";

function SidebarFolderItem({ folder, selectedFolderId, makeFolderLink }) {
  const deleteMutation = useDeleteFolder(folder);
  const { handleGoToFolder } = useFilters();
  const { isOpen, onOpen, onClose } = useDisclosure();

  function handleDelete(e) {
    e.preventDefault();
    deleteMutation.mutate();
    handleGoToFolder("root");
  }

  return (
    <ListItem key={folder.id}>
      <SidebarButton
        as={RouterLink}
        variant={selectedFolderId === folder.id ? "solid" : "ghost"}
        to={makeFolderLink(folder.id)}
        leftIcon={<FolderIcon />}
      >
        <Flex justifyContent="space-between" width="full" overflow="hidden">
          <Text as="span" overflow="hidden" textOverflow="ellipsis">
            {folder.name}
          </Text>
          {selectedFolderId === folder.id && (
            <Menu>
              <MenuButton
                as={IconButton}
                variant="unstyled"
                height="auto"
                width="auto"
                minWidth="1rem"
                padding={0}
                aria-label="Folder options"
                icon={<DotDotDotVert />}
                _focus="none"
              />
              <MenuList color="gray.800">
                <MenuItem icon={<EditIcon />} onClick={onOpen}>
                  Rename
                </MenuItem>
                <MenuItem icon={<DeleteIcon />} onClick={handleDelete}>
                  Delete
                </MenuItem>
              </MenuList>
              <RenameFolderModal
                isOpen={isOpen}
                onClose={onClose}
                folder={folder}
              />
            </Menu>
          )}
        </Flex>
      </SidebarButton>
    </ListItem>
  );
}

export default function SidebarFolderTree() {
  const { folderTree } = useUser();
  const { folderName, folderId, makeFolderLink } = useFilters();
  const mutation = useCreateFolder();

  return (
    <Stack as={List} spacing={1}>
      {[
        <ListItem key="all">
          <SidebarButton
            leftIcon={<HamburgerIcon />}
            as={RouterLink}
            variant={folderId === "root" ? "solid" : "ghost"}
            to={makeFolderLink("root")}
          >
            All
          </SidebarButton>
        </ListItem>,
        ...folderTree.children?.map((folder) => (
          <SidebarFolderItem
            key={folder.id}
            folder={folder}
            selectedFolderName={folderName}
            selectedFolderId={folderId}
            makeFolderLink={makeFolderLink}
          />
        )),
        <ListItem key="new-folder">
          <SidebarPopover
            onSubmit={(newFolderName) =>
              mutation.mutate({ name: newFolderName })
            }
            placeholder="My new folder"
            buttonText="New folder"
            buttonIcon={AddIcon}
          />
        </ListItem>,
      ]}
    </Stack>
  );
}
