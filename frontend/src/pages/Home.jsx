import React from "react";
import { Accordion, Box, Heading } from "@chakra-ui/react";

import ErrorScreen from "../components/ErrorScreen";
import LinkItem from "../components/LinkItem";
import { useLinks } from "../hooks/links";
import { useFilterParams } from "../hooks/filters";
import { isoDateToHeading } from "../utils/time";

function linksBy(grouping, links) {
  switch (grouping) {
    case "day":
      return links.reduce((acc, cur) => {
        const date = isoDateToHeading(cur.createdAt);
        if (acc[date]) {
          acc[date].push(cur);
        } else {
          acc[date] = [cur];
        }
        return acc;
      }, {});
    case "site":
      return links.reduce((acc, cur) => {
        if (acc[cur.site]) {
          acc[cur.site].push(cur);
        } else {
          acc[cur.site] = [cur];
        }
        return acc;
      }, {});
    default:
      return { all: links };
  }
}

export default function Home() {
  const { data: links, isError, error } = useLinks();
  const filterParams = useFilterParams();

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  return (
    <Accordion borderBottom="unset" allowToggle>
      {Object.entries(linksBy(filterParams.group, links)).map(
        ([heading, list]) => {
          return (
            <Box as="section" key={heading}>
              {heading !== "all" && (
                <Heading as="h3" size="sm" marginBottom={4}>
                  {heading}
                </Heading>
              )}
              <Box marginBottom={4}>
                {list.map((link) => (
                  <LinkItem key={link.id} link={link} />
                ))}
              </Box>
            </Box>
          );
        }
      )}
    </Accordion>
  );
}
