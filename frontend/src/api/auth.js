import apiRequest from "./apiRequest";

/*
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.password
 */
export function login(payload) {
  return apiRequest(`/api/users/sessions`, {
    body: payload,
    method: "POST",
  });
}

export function signOut() {
  return apiRequest(`/api/users/sessions`, {
    method: "DELETE",
  });
}

/*
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.password
 */
export function signUp(payload) {
  return apiRequest(`/api/users`, {
    body: payload,
    method: "POST",
  });
}
