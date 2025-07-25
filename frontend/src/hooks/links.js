import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useToast } from "@chakra-ui/react";
import pick from "lodash/pick";
import queryString from "query-string";

import apiFetch from "../utils/apiFetch";
import {
  useFilterParams,
  FILTER_KEY_SORT,
  FILTER_KEY_FAVORITE,
  FILTER_KEY_SEARCH,
  FILTER_KEY_PAGE,
  FILTER_KEY_FOLDER,
  FILTER_KEY_TAG,
  FILTER_KEY_ANNOTATED,
  FILTER_KEY_USER_TAG,
} from "./filters";
import { omit } from "lodash";
import { useHistory } from "react-router-dom";

const REFETCH_FILTERS = [
  FILTER_KEY_SORT,
  FILTER_KEY_FAVORITE,
  FILTER_KEY_SEARCH,
  FILTER_KEY_PAGE,
  FILTER_KEY_FOLDER,
  FILTER_KEY_TAG,
  FILTER_KEY_USER_TAG,
  FILTER_KEY_ANNOTATED,
];

function useForceRefetchFilterParams() {
  return pick(useFilterParams(), REFETCH_FILTERS);
}

export function useCreateLink() {
  const queryClient = useQueryClient();
  const filterParams = useForceRefetchFilterParams();

  return useMutation(
    (payload) =>
      apiFetch(`/api/links`, {
        body: payload,
        method: "POST",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(
          ["links", "list", filterParams],
          (old = []) => [data.link, ...old]
        );

        queryClient.setQueryData("user", data?.user);

        queryClient.invalidateQueries({
          queryKey: ["links", "list"],
          refetchActive: false,
        });
      },
    }
  );
}

export function useLinks(
  options = {
    keepPreviousData: true,
    initialData: () => [],
    overrides: {},
  }
) {
  const filterParams = useForceRefetchFilterParams();
  const filterParamsWithOverrides = { ...filterParams, ...options.overrides };

  return useQuery(
    ["links", "list", filterParamsWithOverrides],
    () =>
      apiFetch(
        `/api/links?${queryString.stringify(filterParamsWithOverrides)}`
      ).then((response) => response.links),
    omit(options, ["overrides"])
  );
}

export function useLink(linkId, options = {}) {
  return useQuery(
    ["links", "detail", linkId],
    () => apiFetch(`/api/links/${linkId}`).then((response) => response.link),
    options
  );
}

export function useGenerateSummary(linkId) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation(
    () => apiFetch(`/api/links/${linkId}/summarize`, {
      body: {},
      method: "POST",
    }),
    {
      onSuccess: (data, _) => {
        queryClient.setQueryData(["links", "detail", linkId], () => data.link);

        if (data.link.summary.length > 0) {
          toast({
            title: "Summary generated",
            status: "success",
            duration: 9000,
            isClosable: true,
          });
        }
      },
      onError: (error) => {
        queryClient.setQueryData(["links", "detail", linkId], (link) => Object.assign(link, { isSummarized: true }));

        toast({
          title: error.toString(),
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      },
    })
}

export function useUpdateLink(linkId, { supressToast = false } = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const filterParams = useForceRefetchFilterParams();

  return useMutation(
    (payload) =>
      apiFetch(`/api/links/${linkId}`, {
        body: pick(payload, [
          "title",
          "description",
          "url",
          "favicon",
          "image",
          "site",
          "isFavorite",
          "folderId",
          "annotation",
          "userTags",
        ]),
        method: "PATCH",
      }),
    {
      onSuccess: (data, payload) => {
        queryClient.setQueryData("user", data?.user);
        queryClient.setQueryData(["links", "detail", linkId], () => data.link);

        queryClient.setQueryData(["links", "list", filterParams], (old = []) =>
          old.map((l) => (l.id === data.link.id ? data.link : l))
        );

        if (!supressToast) {
          toast({
            title: payload?.toast || "Link updated",
            status: "success",
            duration: 9000,
            isClosable: true,
          });
        }
      },
      onError: (error) => {
        toast({
          title: error.toString(),
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      },
    }
  );
}

export function useDeleteLink(linkId) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const filterParams = useForceRefetchFilterParams();

  return useMutation(
    () =>
      apiFetch(`/api/links/${linkId}`, {
        method: "DELETE",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["links", "list", filterParams], (old = []) =>
          old.filter((l) => l.id !== linkId)
        );

        queryClient.invalidateQueries({
          queryKey: ["links", "list"],
          refetchActive: false,
        });

        queryClient.setQueryData("user", data?.user);

        toast({
          title: "Link deleted",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: error.toString(),
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      },
    }
  );
}

export function useLinkOperations(link = {}) {
  const history = useHistory();
  const toast = useToast();
  const { mutateAsync: deleteLink, isLoading: isDeleting } = useDeleteLink(
    link.id
  );
  const { mutateAsync: updateLink } = useUpdateLink(link.id, {
    supressToast: true,
  });
  const { mutateAsync: generateSummary, isLoading: isGeneratingSummary } = useGenerateSummary(link.id);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isMovingFolders, setIsMovingFolders] = useState(false);
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);

  return useMemo(() => {
    async function handleDeleteLink() {
      await deleteLink();

      if (history.location.pathname.endsWith(link.id)) {
        history.push("/");
      }
    }

    async function handleGenerateSummary() {
      await generateSummary();
    }

    async function handleToggleIsFavorite() {
      setIsFavoriting(true);

      const toastMessage = link.isFavorite
        ? "Link removed from favorites"
        : "Link added to favorites";

      await updateLink({ isFavorite: !link.isFavorite });

      setIsFavoriting(false);

      toast({
        title: toastMessage,
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    }

    async function handleSaveAnnotation(annotation) {
      setIsSavingAnnotation(true);
      await updateLink({ annotation });
      setIsSavingAnnotation(false);
    }

    function handleMoveToFolder(folderId) {
      setIsMovingFolders(true);

      const toastMessage =
        folderId === "root"
          ? "Link removed from folder"
          : "Link added to folder";

      updateLink({ folderId });

      setIsMovingFolders(false);

      toast({
        title: toastMessage,
        status: "success",
        duration: 9000,
        isClosable: true,
      });
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

    return {
      handleDeleteLink,
      isDeleting,
      handleGenerateSummary,
      isGeneratingSummary,
      handleToggleIsFavorite,
      isFavoriting,
      handleMoveToFolder,
      isMovingFolders,
      handleSaveAnnotation,
      isSavingAnnotation,
      handleCopyLink,
    };
  }, [
    link,
    isDeleting,
    isGeneratingSummary,
    isFavoriting,
    isMovingFolders,
    isSavingAnnotation,
    toast,
    updateLink,
    deleteLink,
    generateSummary,
    history,
  ]);
}
