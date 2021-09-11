import { useMutation, useQueryClient } from "react-query";
import { useToast } from "@chakra-ui/react";

import apiFetch from "../utils/apiFetch";
import { useUser } from "./auth";

export function useCreateFolder() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation(
    (payload) =>
      apiFetch(`/api/folders`, {
        body: payload,
        method: "POST",
      }),
    {
      onSuccess: (data, payload) => {
        queryClient.setQueryData("user", data?.user);
        toast({
          title: `Folder "${payload.name}" created`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      },
    }
  );
}

export function useUpdateFolder(folder) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation(
    (payload) =>
      apiFetch(`/api/folders/${folder.id}`, {
        body: payload,
        method: "PATCH",
      }),
    {
      onSuccess: (data, payload) => {
        queryClient.setQueryData("user", data?.user);
        toast({
          title: `Folder "${payload.name}" renamed`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      },
    }
  );
}

export function useDeleteFolder(folder) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation(
    () =>
      apiFetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData("user", data?.user);
        toast({
          title: `Folder "${folder.name}" deleted`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      },
    }
  );
}

export function useFolders() {
  const { folderTree } = useUser();

  function resolveFolderName(folderId) {
    if (folderId === "root") {
      return "All";
    }

    let queue = [folderTree];

    while (queue.length > 0) {
      let node = queue.shift();

      if (node.id === folderId) {
        return node.name;
      }

      queue.push(...node.children);
    }

    return "Unknown";
  }

  return { folderTree, resolveFolderName };
}
