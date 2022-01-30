import React from "react";
import { useDrag, useDrop } from "react-dnd";
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
import {
  useCreateFolder,
  useDeleteFolder,
  useUpdateFolder,
} from "../hooks/folders";

const SIDEBAR_FOLDER = "SIDEBAR_FOLDER";

function isChild({ id, children }, target) {
  if (id === target) {
    return true;
  }

  for (let i = 0; i < children.length; i++) {
    if (isChild(children[i], target)) {
      return true;
    }
  }

  return false;
}

function SidebarFolderItem({ folder, selectedFolderId, makeFolderLink }) {
  const deleteMutation = useDeleteFolder(folder);
  const { handleGoToFolder } = useFilters();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isFolderSelected = selectedFolderId === folder.id;
  const isSelectedFolderChild = isChild(folder, selectedFolderId);
  const buttonVariant = isFolderSelected ? "solid" : "ghost";
  const mutation = useUpdateFolder(folder);

  const [, dragRef] = useDrag(
    () => ({
      type: SIDEBAR_FOLDER,
      item: folder,
      end: (item, monitor) => {
        if (monitor.didDrop()) {
          const { parent } = monitor.getDropResult();
          mutation.mutate({ name: item.name, parentId: parent.id });
        }
      },
    }),
    [folder]
  );

  const [dropProps, dropRef] = useDrop(
    () => ({
      accept: [SIDEBAR_FOLDER, "LINK"],
      drop: () => ({
        parent: folder,
      }),
      collect: (monitor) => ({
        variant: monitor.isOver() ? "outline" : buttonVariant,
      }),
    }),
    [buttonVariant, folder]
  );

  function handleDelete(e) {
    e.preventDefault();
    deleteMutation.mutate();
    handleGoToFolder("root");
  }

  return (
    <ListItem key={folder.id} ref={dragRef}>
      <SidebarButton
        ref={dropRef}
        as={RouterLink}
        variant={buttonVariant}
        to={makeFolderLink(folder.id)}
        leftIcon={<FolderIcon />}
        isLoading={mutation.isLoading}
        {...dropProps}
      >
        <Flex justifyContent="space-between" width="full" overflow="hidden">
          <Text as="span" overflow="hidden" textOverflow="ellipsis">
            {folder.name}
          </Text>
          {isFolderSelected && (
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
      {isSelectedFolderChild && folder.children.length > 0 && (
        <List paddingLeft={6} paddingTop={1} spacing={1}>
          {folder.children.map((child) => (
            <SidebarFolderItem
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              makeFolderLink={makeFolderLink}
            />
          ))}
        </List>
      )}
    </ListItem>
  );
}

export default function SidebarFolderTree() {
  const { folderTree } = useUser();
  const { folderName, folderId, makeFolderLink } = useFilters();
  const isFolderSelected = folderId === "root";
  const buttonVariant = isFolderSelected ? "solid" : "ghost";
  const mutation = useCreateFolder();

  const [dropProps, dropRef] = useDrop(
    () => ({
      accept: SIDEBAR_FOLDER,
      drop: () => ({
        parent: { id: "root" },
      }),
      collect: (monitor) => ({
        variant: monitor.isOver() ? "outline" : buttonVariant,
      }),
    }),
    [isFolderSelected]
  );

  return (
    <Stack as={List} spacing={1}>
      {[
        <ListItem key="all">
          <SidebarButton
            ref={dropRef}
            leftIcon={<HamburgerIcon />}
            as={RouterLink}
            to={makeFolderLink("root")}
            {...dropProps}
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
