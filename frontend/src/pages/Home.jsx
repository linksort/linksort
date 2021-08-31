import React from "react";
import { Grid, GridItem, List, Heading } from "@chakra-ui/react";

import ErrorScreen from "../components/ErrorScreen";
import FloatingPill from "../components/FloatingPill";
import Sidebar from "../components/Sidebar";
import LinkItem from "../components/LinkItem";
import { useLinks } from "../api/links";

export default function Home() {
  const { data: links, isError, error } = useLinks({ pageNumber: 0 });

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  return (
    <FloatingPill width="100%" display="flex" alignItems="stretch">
      <Grid
        maxWidth="100%"
        width="100%"
        height="100%"
        templateColumns={["1fr", "1fr", "16rem 1fr", "16rem 1fr"]}
        gap={6}
      >
        <GridItem
          height="100%"
          display={["none", "none", "block", "block"]}
          borderRight="dashed"
          borderRightColor="gray.200"
          borderRightWidth="thin"
        >
          <Sidebar />
        </GridItem>
        <GridItem>
          <Heading as="h2" size="md" marginBottom={5}>
            All
          </Heading>
          <List spacing={3}>
            {links.map((link) => (
              <LinkItem key={link.id} link={link} />
            ))}
          </List>
        </GridItem>
      </Grid>
    </FloatingPill>
  );
}
