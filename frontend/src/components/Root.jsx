import React from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";

import "../theme/prose.css";
import theme from "../theme/theme";

import AuthRoute from "./AuthRoute";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import ForgotPassword from "../pages/ForgotPassword";
import ForgotPasswordSentEmail from "../pages/ForgotPasswordSentEmail";
import ChangePassword from "../pages/ChangePassword";
import Home from "../pages/Home";
import Link from "../pages/Link";

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
            <AuthRoute
              isAuthRequired={false}
              redirectTo="/"
              path="/sign-in"
              component={SignIn}
            />
            <AuthRoute
              isAuthRequired={false}
              redirectTo="/"
              path="/sign-up"
              component={SignUp}
            />
            <AuthRoute
              isAuthRequired={false}
              redirectTo="/"
              path="/forgot-password"
              component={ForgotPassword}
            />
            <AuthRoute
              isAuthRequired={false}
              redirectTo="/"
              path="/forgot-password-sent-email"
              component={ForgotPasswordSentEmail}
            />
            <AuthRoute
              isAuthRequired={false}
              redirectTo="/"
              path="/change-password"
              component={ChangePassword}
            />
            <AuthRoute
              isAuthRequired={true}
              redirectTo="/sign-in"
              path="/links/:linkId"
              component={Link}
            />
            <AuthRoute
              isAuthRequired={true}
              redirectTo="/sign-in"
              path="/"
              component={Home}
            />
          </Switch>
        </BrowserRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
