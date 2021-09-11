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

function SidebarFolderItem({ folder, selectedFolderName, makeFolderLink }) {
  const deleteMutation = useDeleteFolder(folder);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <ListItem key={folder.id}>
      <SidebarButton
        as={RouterLink}
        variant={selectedFolderName === folder.name ? "solid" : "ghost"}
        to={makeFolderLink(folder.id)}
        leftIcon={<FolderIcon />}
      >
        <Flex justifyContent="space-between" width="full" overflow="hidden">
          <Text as="span" overflow="hidden" textOverflow="ellipsis">
            {folder.name}
          </Text>
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
            />
            <MenuList>
              <MenuItem icon={<EditIcon />} onClick={onOpen}>
                Rename
              </MenuItem>
              <MenuItem icon={<DeleteIcon />} onClick={deleteMutation.mutate}>
                Delete
              </MenuItem>
            </MenuList>
            <RenameFolderModal
              isOpen={isOpen}
              onClose={onClose}
              folder={folder}
            />
          </Menu>
        </Flex>
      </SidebarButton>
    </ListItem>
  );
}

export default function SidebarFolderTree() {
  const { folderTree } = useUser();
  const { folderName, handleGoToFolder, makeFolderLink } = useFilters();
  const mutation = useCreateFolder();

  return (
    <Stack as={List} spacing={1}>
      {[
        <ListItem key="all">
          <SidebarButton
            variant={folderName === "root" ? "solid" : "ghost"}
            onClick={() => handleGoToFolder("root")}
            leftIcon={<HamburgerIcon />}
          >
            All
          </SidebarButton>
        </ListItem>,
        ...folderTree.children?.map((folder) => (
          <SidebarFolderItem
            key={folder.id}
            folder={folder}
            selectedFolderName={folderName}
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
