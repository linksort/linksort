import React from "react";
import { Grid, GridItem, List, ListItem, Box } from "@chakra-ui/react";

import ErrorScreen from "../components/ErrorScreen";
import FloatingPill from "../components/FloatingPill";
import { useLinks } from "../api/links";

export default function Home() {
  const { data: links, isError, error } = useLinks({ pageNumber: 0 });

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  return (
    <FloatingPill width="100%">
      <Grid
        maxWidth="100%"
        width="100%"
        templateColumns={["1fr", "1fr", "16rem 1fr", "16rem 1fr"]}
        gap={4}
      >
        <GridItem
          backgroundColor="blue.100"
          display={["none", "none", "block", "block"]}
        >
          Sidebar
        </GridItem>
        <GridItem backgroundColor="blue.100">
          Main
          <List>
            {links.map((link) => (
              <ListItem key={link.id}>{link.title}</ListItem>
            ))}
          </List>
        </GridItem>
      </Grid>
    </FloatingPill>
  );
}
