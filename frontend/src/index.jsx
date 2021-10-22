import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";
import Root from "./components/Root";

Sentry.init({ dsn: process.env.REACT_APP_SENTRY_DSN });

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById("root")
);
