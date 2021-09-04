import React from "react";
import { Route, Redirect } from "react-router-dom";

import AppLayout from "./AppLayout";
import AuthLayout from "./AuthLayout";
import { useUser } from "../hooks/auth";

function SmartLayout({ isAuthRequired, children }) {
  if (isAuthRequired) {
    return <AppLayout>{children}</AppLayout>;
  } else {
    return <AuthLayout>{children}</AuthLayout>;
  }
}

export default function AuthRoute({
  component: Component,
  isAuthRequired = false,
  redirectTo = "/",
  ...rest
}) {
  const user = useUser();
  const shouldRedirect = isAuthRequired ? !user : !!user;

  return (
    <SmartLayout isAuthRequired={isAuthRequired}>
      <Route
        {...rest}
        render={() => {
          if (shouldRedirect) {
            return <Redirect to={redirectTo} />;
          } else {
            return <Component />;
          }
        }}
      />
    </SmartLayout>
  );
}
