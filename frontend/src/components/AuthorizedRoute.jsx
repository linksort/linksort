import { Route, Redirect } from "react-router-dom";

import { useUser } from "../api/auth";

export default function AuthorizedRoute({ component: Component, ...rest }) {
  const user = useUser();

  return (
    <Route
      {...rest}
      render={() => {
        if (!!user) {
          return <Component />;
        } else {
          return <Redirect to="/sign-in" />;
        }
      }}
    />
  );
}
