import React from "react";
import { ListItem } from "@chakra-ui/react";

import { useDeleteLink, useUpdateLink } from "../hooks/links";
import { useFolders } from "../hooks/folders";
import LinkItemCondensed from "./LinkItemCondensed";

export default function LinkItem({ link }) {
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
    <ListItem>
      <LinkItemCondensed
        link={link}
        folderTree={folderTree}
        isLinkInFolder={isLinkInFolder}
        currentFolderName={currentFolderName}
        onDeleteLink={handleDeleteLink}
        onToggleIsFavorite={handleToggleIsFavorite}
        onMoveToFolder={handleMoveToFolder}
      />
    </ListItem>
  );
}
