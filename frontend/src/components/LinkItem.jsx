import React from "react";
import { ListItem } from "@chakra-ui/react";

import { useDeleteLink, useUpdateLink } from "../hooks/links";
import { useFolders } from "../hooks/folders";
import {
  useViewSetting,
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
} from "../hooks/views";
import LinkItemCondensed from "./LinkItemCondensed";
import LinkItemTall from "./LinkItemTall";
import LinkItemTile from "./LinkItemTile";

export default function LinkItem({ link }) {
  const { setting: viewSetting } = useViewSetting();
  const deleteMutation = useDeleteLink(link.id);
  const updateMutation = useUpdateLink(link.id);
  const { folderTree, resolveFolderName } = useFolders();
  const currentFolderName = resolveFolderName(link.folderId, "Add to folder");
  const isLinkInFolder = link.folderId !== "root" && link.folderId.length > 0;

  function handleDeleteLink() {
    deleteMutation.mutate();
  }

  function handleToggleIsFavorite() {
    updateMutation.mutate({ isFavorite: !link.isFavorite });
  }

  function handleMoveToFolder(folderId) {
    updateMutation.mutate({ folderId });
  }

  return (
    <ListItem minWidth={0}>
      {
        {
          [VIEW_SETTING_CONDENSED]: (
            <LinkItemCondensed
              link={link}
              folderTree={folderTree}
              isLinkInFolder={isLinkInFolder}
              currentFolderName={currentFolderName}
              onDeleteLink={handleDeleteLink}
              onToggleIsFavorite={handleToggleIsFavorite}
              onMoveToFolder={handleMoveToFolder}
            />
          ),
          [VIEW_SETTING_TALL]: (
            <LinkItemTall
              link={link}
              folderTree={folderTree}
              isLinkInFolder={isLinkInFolder}
              currentFolderName={currentFolderName}
              onDeleteLink={handleDeleteLink}
              onToggleIsFavorite={handleToggleIsFavorite}
              onMoveToFolder={handleMoveToFolder}
            />
          ),
          [VIEW_SETTING_TILES]: (
            <LinkItemTile
              link={link}
              folderTree={folderTree}
              isLinkInFolder={isLinkInFolder}
              currentFolderName={currentFolderName}
              onDeleteLink={handleDeleteLink}
              onToggleIsFavorite={handleToggleIsFavorite}
              onMoveToFolder={handleMoveToFolder}
            />
          ),
        }[viewSetting]
      }
    </ListItem>
  );
}
