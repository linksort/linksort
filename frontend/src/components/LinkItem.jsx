import React from "react";
import { ListItem, useToast } from "@chakra-ui/react";

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
  const toast = useToast();
  const { setting: viewSetting } = useViewSetting();
  const deleteMutation = useDeleteLink(link.id);
  const updateMutation = useUpdateLink(link.id);
  const { folderTree, resolveFolderName } = useFolders();
  const currentFolderName = resolveFolderName(link.folderId, "");
  const isLinkInFolder = link.folderId !== "root" && link.folderId.length > 0;

  function handleDeleteLink() {
    deleteMutation.mutate();
  }

  function handleToggleIsFavorite() {
    const toast = link.isFavorite
      ? "Link removed from favorites"
      : "Link added to favorites";
    updateMutation.mutate({ isFavorite: !link.isFavorite, toast });
  }

  function handleMoveToFolder(folderId) {
    const toast =
      folderId === "root" ? "Link removed from folder" : "Link added to folder";
    updateMutation.mutate({ folderId, toast });
  }

  function handleCopyLink() {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("value", link.url);
    document.body.appendChild(input);
    input.select();
    const isSuccess = document.execCommand("copy");
    document.body.removeChild(input);
    if (isSuccess) {
      toast({
        title: "Copied URL to clipboard",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    }
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
              onCopyLink={handleCopyLink}
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
              onCopyLink={handleCopyLink}
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
              onCopyLink={handleCopyLink}
            />
          ),
        }[viewSetting]
      }
    </ListItem>
  );
}
