import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";
import { Text } from "@chakra-ui/react";

import "./theme/prose.css";
import theme from "./theme/theme";

const chakraTheme = extendTheme({
  ...theme,
  breakpoints: createBreakpoints(theme.breakpoints),
});

export default function App() {
  return (
    <ChakraProvider theme={chakraTheme}>
      <Text>Hello world</Text>
    </ChakraProvider>
  );
}
