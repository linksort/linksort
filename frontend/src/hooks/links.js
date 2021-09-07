import { useMutation, useQuery, useQueryClient } from "react-query";
import { useToast } from "@chakra-ui/react";
import pick from "lodash/pick";
import queryString from "query-string";

import apiFetch from "../utils/apiFetch";
import { useFilterParams } from "./filters";

const REFETCH_FILTER_PARAMS = ["page", "search", "sort", "favorite", "folder"];

function useForceRefetchFilterParams() {
  return pick(useFilterParams(), REFETCH_FILTER_PARAMS);
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
        queryClient.invalidateQueries({
          queryKey: ["links", "list"],
          refetchActive: false,
        });
      },
    }
  );
}

export function useUpdateLink(linkId) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const filterParams = useForceRefetchFilterParams();

  return useMutation(
    (payload) =>
      apiFetch(`/api/links/${linkId}`, {
        body: pick(payload, ["title", "description", "isFavorite"]),
        method: "PATCH",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["links", "detail", linkId], () => data.link);
        queryClient.setQueryData(["links", "list", filterParams], (old = []) =>
          old.map((l) => (l.id === data.link.id ? data.link : l))
        );
        queryClient.invalidateQueries({
          queryKey: ["links", "list"],
          refetchActive: false,
        });
        toast({
          title: "Link updated",
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
      onSuccess: () => {
        queryClient.setQueryData(["links", "list", filterParams], (old = []) =>
          old.filter((l) => l.id !== linkId)
        );
        queryClient.invalidateQueries({
          queryKey: ["links", "list"],
          refetchActive: false,
        });
        toast({
          title: "Link deleted",
          status: "success",
          duration: 9000,
          isClosable: true,
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
