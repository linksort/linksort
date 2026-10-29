import { useMemo } from "react";
import { useMutation, useQueryClient } from "react-query";
import { useToast } from "@chakra-ui/react";

import apiFetch from "../utils/apiFetch";

/**
 * Mutations for a link's highlights. Every endpoint returns the whole
 * updated link, which replaces the detail cache and is patched into any
 * cached list that contains it; other lists are invalidated lazily.
 */
export function useHighlights(linkId) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const options = useMemo(
    () => ({
      onSuccess: (data) => {
        const link = data.link;
        queryClient.setQueryData(["links", "detail", linkId], () => link);
        queryClient.setQueriesData(["links", "list"], (old) =>
          Array.isArray(old) ? old.map((l) => (l.id === link.id ? { ...l, ...link } : l)) : old
        );
        queryClient.invalidateQueries({
          queryKey: ["links", "list"],
          refetchActive: false,
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
    }),
    [queryClient, linkId, toast]
  );

  const create = useMutation(
    (payload) =>
      apiFetch(`/api/links/${linkId}/highlights`, {
        method: "POST",
        body: {
          exact: payload.exact,
          prefix: payload.prefix || "",
          suffix: payload.suffix || "",
          start: payload.start || 0,
          end: payload.end || 0,
          note: payload.note || "",
        },
      }),
    options
  );

  const update = useMutation(
    ({ highlightId, note }) =>
      apiFetch(`/api/links/${linkId}/highlights/${highlightId}`, {
        method: "PATCH",
        body: { note },
      }),
    options
  );

  const remove = useMutation(
    (highlightId) =>
      apiFetch(`/api/links/${linkId}/highlights/${highlightId}`, {
        method: "DELETE",
      }),
    options
  );

  return {
    createHighlight: create.mutateAsync,
    isCreating: create.isLoading,
    updateHighlightNote: update.mutateAsync,
    isUpdating: update.isLoading,
    removeHighlight: remove.mutateAsync,
    isRemoving: remove.isLoading,
  };
}
