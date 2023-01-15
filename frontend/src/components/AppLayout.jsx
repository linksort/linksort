import React from "react";
import { Grid, GridItem, Container, Box } from "@chakra-ui/react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { HEADER_HEIGHT } from "../theme/theme";

export default function AppLayout({ children }) {
  return (
    <Container maxWidth="100vw" px={0} position="relative" overflowX="hidden">
      <Grid
        maxWidth="100%"
        width="100%"
        minHeight="100vh"
        templateColumns={["1fr", "1fr", "1fr", "1fr", "18rem 1fr"]}
      >
        <GridItem
          height="100%"
          display={["none", "none", "none", "none", "block"]}
          borderRight="1px"
          borderRightColor="gray.100"
        >
          <Sidebar />
        </GridItem>
        <GridItem
          width="100%"
          maxWidth={[
            "calc(100vw)",
            "calc(100vw)",
            "calc(100vw)",
            "calc(100vw)",
            "calc(100vw - 18rem)",
          ]}
        >
          <Box
            position="fixed"
            width="100%"
            top="0"
            left={["0", "0", "0", "0", "18rem"]}
            zIndex={10}
          >
            <Header />
          </Box>
          <Box as="main" marginTop={HEADER_HEIGHT} marginX="auto" width="100%">
            {children}
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
}
