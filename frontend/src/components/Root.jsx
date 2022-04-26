import React from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import "../theme/prose.css";
import "../theme/shepherd.css";
import theme from "../theme/theme";

import AuthRoute from "./AuthRoute";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import ForgotPassword from "../pages/ForgotPassword";
import ForgotPasswordSentEmail from "../pages/ForgotPasswordSentEmail";
import ChangePassword from "../pages/ChangePassword";
import Home from "../pages/Home";
import LinkUpdate from "../pages/LinkUpdate";
import LinkView from "../pages/LinkView";
import Extensions from "../pages/Extensions";
import Account from "../pages/Account";
import Graph from "../pages/Graph";
import { ViewSettingProvider } from "../hooks/views";
import { GlobalFiltersProvider } from "../hooks/filters";
import { getScrollbarWidth } from "../utils/styles";

const chakraTheme = extendTheme({
  ...theme,
  breakpoints: createBreakpoints(theme.breakpoints),
  styles: {
    global: () => {
      // Make scrollbars look less bad when shown.
      if (getScrollbarWidth() > 0) {
        return {
          "::-webkit-scrollbar": {
            background: "transparent",
            width: "10px",
            height: "10px",
          },
          "::-webkit-scrollbar-thumb": {
            background: "#ccc",
          },
          "::-webkit-scrollbar-track": {
            background: "#eee;",
          },
        };
      }

      return {};
    },
  },
});

const queryClient = new QueryClient();

export default function App() {
  return (
    <ChakraProvider theme={chakraTheme}>
      <GlobalFiltersProvider>
        <QueryClientProvider client={queryClient}>
          <DndProvider backend={HTML5Backend}>
            <ViewSettingProvider>
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
                    path="/links/:linkId/update"
                    component={LinkUpdate}
                  />
                  <AuthRoute
                    isAuthRequired={true}
                    redirectTo="/sign-in"
                    path="/links/:linkId"
                    component={LinkView}
                  />
                  <AuthRoute
                    isAuthRequired={true}
                    redirectTo="/sign-in"
                    path="/graph"
                    component={Graph}
                  />
                  <AuthRoute
                    isAuthRequired={true}
                    redirectTo="/sign-in"
                    path="/extensions"
                    component={Extensions}
                  />
                  <AuthRoute
                    isAuthRequired={true}
                    redirectTo="/sign-in"
                    path="/account"
                    component={Account}
                  />
                  <AuthRoute
                    isAuthRequired={true}
                    redirectTo="/sign-in"
                    path="/"
                    component={Home}
                  />
                </Switch>
              </BrowserRouter>
            </ViewSettingProvider>
          </DndProvider>
        </QueryClientProvider>
      </GlobalFiltersProvider>
    </ChakraProvider>
  );
}
