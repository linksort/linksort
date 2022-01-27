import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";
import Root from "./components/Root";

Sentry.init({ dsn: process.env.REACT_APP_SENTRY_DSN });

// Reload every 24hr to prevent stale CSRF tokens and stale code.
const initialLoadTime = Date.now();
window.addEventListener("focus", () => {
  if (Date.now() - initialLoadTime > 86400000) {
    window.location.reload();
  }
});

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById("root")
);
