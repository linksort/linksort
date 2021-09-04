import { useMutation, useQuery, useQueryClient } from "react-query";

import apiRequest from "./apiRequest";

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation(
    (payload) =>
      apiRequest(`/api/links`, {
        body: payload,
        method: "POST",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["links"], (old) => [data.link, ...old]);
      },
    }
  );
}

export function useLinks({ page = 0 }) {
  return useQuery(
    ["links"],
    () =>
      apiRequest(`/api/links?page=${page}`).then((response) => response.links),
    { keepPreviousData: true, initialData: () => [] }
  );
}

export function useLink(linkId) {
  const queryClient = useQueryClient();

  return useQuery(
    ["links", linkId],
    () => apiRequest(`/api/links/${linkId}`).then((response) => response.link),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["links"], (old) =>
          (old || []).map((l) => (l.id === data.id ? data : l))
        );
      },
    }
  );
}
