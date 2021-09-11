import React from "react";
import {
  Accordion,
  Box,
  Heading,
  HStack,
  Button,
  Stack,
  Skeleton,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

import ErrorScreen from "../components/ErrorScreen";
import LinkItem from "../components/LinkItem";
import { useLinks } from "../hooks/links";
import { useFilters } from "../hooks/filters";
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
  const { data: links, isError, error, isLoading } = useLinks();
  const {
    handleGoToNextPage,
    handleGoToPrevPage,
    handleSearch,
    groupName,
    searchQuery,
  } = useFilters();

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  if (isLoading) {
    return (
      <Stack>
        <Skeleton height={8} />
        <Skeleton height={8} />
        <Skeleton height={8} />
        <Skeleton height={8} />
      </Stack>
    );
  }

  return (
    <Box marginBottom={16}>
      <Accordion borderBottom="unset" allowToggle>
        {Object.entries(linksBy(groupName, links)).map(([heading, list]) => {
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
        })}
      </Accordion>
      <HStack marginTop={8}>
        {searchQuery && searchQuery.length > 0 ? (
          <Button onClick={handleSearch("")}>Go back</Button>
        ) : (
          <>
            <Button onClick={handleGoToPrevPage} leftIcon={<ChevronLeftIcon />}>
              Prevous
            </Button>
            <Button
              onClick={handleGoToNextPage}
              rightIcon={<ChevronRightIcon />}
            >
              Next
            </Button>
          </>
        )}
      </HStack>
    </Box>
  );
}
