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
} from "./filters";

const REFETCH_FILTERS = [
  FILTER_KEY_SORT,
  FILTER_KEY_FAVORITE,
  FILTER_KEY_SEARCH,
  FILTER_KEY_PAGE,
  FILTER_KEY_FOLDER,
  FILTER_KEY_TAG,
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

export function useLinks() {
  const filterParams = useForceRefetchFilterParams();

  return useQuery(
    ["links", "list", filterParams],
    () =>
      apiFetch(`/api/links?${queryString.stringify(filterParams)}`).then(
        (response) => response.links
      ),
    { keepPreviousData: true, initialData: () => [] }
  );
}

export function useLink(linkId) {
  return useQuery(
    ["links", "detail", linkId],
    () => apiFetch(`/api/links/${linkId}`).then((response) => response.link),
    {}
  );
}

export function useUpdateLink(linkId) {
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
        ]),
        method: "PATCH",
      }),
    {
      onSuccess: (data, payload) => {
        queryClient.setQueryData(["links", "detail", linkId], () => data.link);
        queryClient.setQueryData(["links", "list", filterParams], (old = []) =>
          old.map((l) => (l.id === data.link.id ? data.link : l))
        );
        queryClient.invalidateQueries({
          queryKey: ["links", "list"],
          refetchActive: false,
        });
        toast({
          title: payload?.toast || "Link updated",
          status: "success",
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
