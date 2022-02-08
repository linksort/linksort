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
import { ViewSettingProvider } from "../hooks/views";
import { GlobalFiltersProvider } from "../hooks/filters";

const chakraTheme = extendTheme({
  ...theme,
  breakpoints: createBreakpoints(theme.breakpoints),
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
                    path="/extensions"
                    component={Extensions}
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
