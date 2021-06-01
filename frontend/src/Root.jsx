import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";
import { Text } from "@chakra-ui/react";

import "./theme/prose.css";
import theme from "./theme/theme";

import Login from "./Login";
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
        <Text>Hello world!</Text>
        <BrowserRouter>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/sign-up" component={SignUp} />
          </Switch>
        </BrowserRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
