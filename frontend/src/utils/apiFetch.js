import CSRFStore from "./csrf";

const API_ORIGIN = "";

const csrfStore = new CSRFStore();

class ApiError extends Error {
  constructor(json) {
    super();

    const keys = Object.keys(json);

    for (let i = 0; i < keys.length; i++) {
      this[keys[i]] = json[keys[i]];
    }
  }
}

export default async function apiFetch(url, data = {}) {
  const method = data.method || "GET";
  const fullUrl = `${API_ORIGIN}${url}`;
  const headers = new Headers();

  let body = null;

  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    headers.append("X-Csrf-Token", csrfStore.get());
    headers.append("Content-Type", "application/json");
    body = JSON.stringify(data.body);
  }

  const response = await fetch(fullUrl, {
    headers,
    method,
    body,
    mode: "same-origin",
    credentials: "same-origin",
  });

  csrfStore.scanResponse(response);

  if (response.status === 204) {
    return {};
  }

  const json = await response.json();

  if (response.status >= 400) {
    throw new ApiError(json);
  }

  return json;
}
