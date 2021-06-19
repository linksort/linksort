import { useMutation, useQuery, useQueryClient } from "react-query";
import { useHistory } from "react-router-dom";

import apiRequest from "./apiRequest";

export function useUser() {
  const { data } = useQuery("user", () => apiRequest("/api/users"), {
    initialData: () => {
      return window.__SERVER_DATA__.user;
    },
    enabled: false,
  });

  return data;
}

/*
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.password
 */
export function useSignIn() {
  const history = useHistory();
  const queryClient = useQueryClient();

  return useMutation(
    (payload) =>
      apiRequest(`/api/users/sessions`, {
        body: payload,
        method: "POST",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData("user", data?.user);
        history.push("/");
      },
    }
  );
}

export function useSignOut() {
  const history = useHistory();
  const queryClient = useQueryClient();

  return useMutation(
    () =>
      apiRequest(`/api/users/sessions`, {
        method: "DELETE",
      }),
    {
      onSuccess: () => {
        window.__SERVER_DATA__ = {};
        queryClient.setQueryData("user", undefined);
        history.push("/sign-in");
      },
    }
  );
}

/*
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.password
 */
export function useSignUp() {
  const history = useHistory();
  const queryClient = useQueryClient();

  return useMutation(
    (payload) =>
      apiRequest(`/api/users`, {
        body: payload,
        method: "POST",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData("user", data.user);
        history.push("/");
      },
    }
  );
}

/*
 * @param {Object} payload
 * @param {string} payload.email
 */
export function useForgotPassword() {
  const history = useHistory();

  return useMutation(
    (payload) =>
      apiRequest(`/api/users/forgot-password`, {
        body: payload,
        method: "POST",
      }),
    {
      onSuccess: () => {
        history.push("/forgot-password-sent-email");
      },
    }
  );
}

/*
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.password
 * @param {string} payload.signature
 * @param {string} payload.timestamp
 */
export function useChangePassword() {
  const history = useHistory();
  const queryClient = useQueryClient();

  return useMutation(
    (payload) =>
      apiRequest(`/api/users/change-password`, {
        body: payload,
        method: "POST",
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData("user", data.user);
        history.push("/");
      },
    }
  );
}
