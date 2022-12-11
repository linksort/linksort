import React from "react";
import { Grid, GridItem, Flex, Container, Box } from "@chakra-ui/react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { HEADER_HEIGHT } from "../theme/theme";

export default function AppLayout({ children }) {
  return (
    <Container maxWidth="7xl" px={0} position="relative" overflowX="hidden">
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
          <Box
            position="fixed"
            left={0}
            height="100vh"
            width="calc(50vw - 40rem)"
            backgroundColor="gray.50"
          />
          <Sidebar />
        </GridItem>
        <GridItem
          width="100%"
          maxWidth={[
            "calc(100vw)",
            "calc(100vw)",
            "calc(100vw)",
            "calc(100vw)",
            "calc(100vw - 19rem)",
          ]}
        >
          <Flex
            position="fixed"
            width="100%"
            top="0"
            left="0"
            justifyContent="flex-end"
            zIndex={2}
          >
            <Box
              width="50%"
              borderBottom="1px"
              borderBottomColor="gray.100"
              height={HEADER_HEIGHT}
              backgroundColor="white"
            />
          </Flex>
          <Box position="fixed" width="100%" top="0" left="0" zIndex={10}>
            <Header />
          </Box>
          <Box as="main" marginTop={HEADER_HEIGHT} width="100%">
            {children}
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
}
