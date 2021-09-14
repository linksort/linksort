import { useMutation, useQuery, useQueryClient } from "react-query";
import { useHistory } from "react-router-dom";

import apiFetch from "../utils/apiFetch";

const USER_SHAPE = {
  folderTree: { id: "root", name: "root", children: [] },
  id: false,
};

export function useUser() {
  const { data } = useQuery("user", () => apiFetch("/api/users"), {
    initialData: () => {
      return Object.assign({}, USER_SHAPE, window.__SERVER_DATA__.user);
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
      apiFetch(`/api/users/sessions`, {
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
      apiFetch(`/api/users/sessions`, {
        method: "DELETE",
      }),
    {
      onSuccess: () => {
        window.__SERVER_DATA__ = {};
        queryClient.setQueryData("user", USER_SHAPE);
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
      apiFetch(`/api/users`, {
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
      apiFetch(`/api/users/forgot-password`, {
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
      apiFetch(`/api/users/change-password`, {
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
