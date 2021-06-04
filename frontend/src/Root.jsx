import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";

import "./theme/prose.css";
import theme from "./theme/theme";

import Layout from "./Layout";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

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
          <Layout>
            <Switch>
              <Route path="/sign-in" component={SignIn} />
              <Route path="/sign-up" component={SignUp} />
            </Switch>
          </Layout>
        </BrowserRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
