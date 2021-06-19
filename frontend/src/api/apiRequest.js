const API_ORIGIN = "";

export default function apiRequest(url, data = {}) {
  return new Promise((resolve, reject) => {
    const method = data.method || "GET";
    const fullUrl = `${API_ORIGIN}${url}`;
    const headers = new Headers();

    // TODO: CSRF token in headers

    let body;
    if (!(data.body instanceof FormData)) {
      headers.append("Content-Type", "application/json");
      body = JSON.stringify(data.body);
    } else {
      body = data.body;
    }

    fetch(fullUrl, {
      headers,
      method,
      body,
      mode: "same-origin",
      credentials: "same-origin",
    })
      .then((response) => {
        if (response.status >= 400) {
          response
            .json()
            .then((parsed) => reject(parsed))
            .catch((e) => reject(e));
        } else if (response.status === 204) {
          resolve(response);
        } else {
          response
            .json()
            .then((parsed) => resolve(parsed))
            .catch((e) => reject(e));
        }
      })
      .catch((err) => reject(err));
  });
}