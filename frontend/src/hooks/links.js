import { useMutation, useQuery, useQueryClient } from "react-query";
import { useHistory } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import pick from "lodash/pick";

import apiFetch from "../utils/apiFetch";

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation(
    (payload) =>
      apiFetch(`/api/links`, {
        body: payload,
        method: "POST",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["links"], (old = []) => [data.link, ...old]);
      },
    }
  );
}

export function useUpdateLink(linkId) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const history = useHistory();

  return useMutation(
    (payload) =>
      apiFetch(`/api/links/${linkId}`, {
        body: pick(payload, ["title", "description"]),
        method: "PATCH",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["links"], (old = []) =>
          old.map((l) => (l.id === data.id ? data : l))
        );
        toast({
          title: "Link updated",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
        history.goBack();
      },
    }
  );
}

export function useDeleteLink(linkId) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation(
    () =>
      apiFetch(`/api/links/${linkId}`, {
        method: "DELETE",
      }),
    {
      onSuccess: () => {
        queryClient.setQueryData(["links"], (old = []) =>
          old.filter((l) => l.id !== linkId)
        );
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

export function useLinks({ page = 0 }) {
  return useQuery(
    ["links"],
    () =>
      apiFetch(`/api/links?page=${page}`).then((response) => response.links),
    { keepPreviousData: true, initialData: () => [] }
  );
}

export function useLink(linkId) {
  const queryClient = useQueryClient();

  return useQuery(
    ["links", linkId],
    () => apiFetch(`/api/links/${linkId}`).then((response) => response.link),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["links"], (old = []) =>
          old.map((l) => (l.id === data.id ? data : l))
        );
      },
    }
  );
}
