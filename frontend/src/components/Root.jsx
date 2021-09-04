import React from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";

import "../theme/prose.css";
import theme from "../theme/theme";

import UnauthoirzedRoute from "./UnauthoirzedRoute";
import AuthoirzedRoute from "./AuthorizedRoute";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import ForgotPassword from "../pages/ForgotPassword";
import ForgotPasswordSentEmail from "../pages/ForgotPasswordSentEmail";
import ChangePassword from "../pages/ChangePassword";
import Home from "../pages/Home";

const chakraTheme = extendTheme({
  ...theme,
  breakpoints: createBreakpoints(theme.breakpoints),
});

const queryClient = new QueryClient();

export default function App() {
  return (
    <ChakraProvider theme={chakraTheme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Switch>
            <UnauthoirzedRoute path="/sign-in" component={SignIn} />
            <UnauthoirzedRoute path="/sign-up" component={SignUp} />
            <UnauthoirzedRoute
              path="/forgot-password"
              component={ForgotPassword}
            />
            <UnauthoirzedRoute
              path="/forgot-password-sent-email"
              component={ForgotPasswordSentEmail}
            />
            <UnauthoirzedRoute
              path="/change-password"
              component={ChangePassword}
            />
            <AuthoirzedRoute path="/" component={Home} />
          </Switch>
        </BrowserRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
