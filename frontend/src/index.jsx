import '@fontsource/inter/100.css';
import '@fontsource/inter/200.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

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
