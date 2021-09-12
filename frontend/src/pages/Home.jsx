import React from "react";
import {
  Box,
  Heading,
  HStack,
  Button,
  Stack,
  Skeleton,
  List,
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
    pageNumber,
  } = useFilters();
  const linksCount = links.length;
  const isSearching = searchQuery && searchQuery.length > 0;

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
    <Box
      minHeight="calc(100vh - 7.5rem)"
      position="relative"
      paddingBottom="4rem"
      marginBottom="1.5rem"
    >
      <Box marginBottom={8}>
        {Object.entries(linksBy(groupName, links)).map(([heading, list]) => {
          return (
            <Box as="section" key={heading}>
              {heading !== "all" && (
                <Heading as="h3" size="sm" marginBottom={4}>
                  {heading}
                </Heading>
              )}
              <List marginBottom={4}>
                {list.map((link) => (
                  <LinkItem key={link.id} link={link} />
                ))}
              </List>
            </Box>
          );
        })}
      </Box>
      {isSearching ? (
        <Box marginTop={6}>
          <Button onClick={() => handleSearch("")}>Clear search</Button>
        </Box>
      ) : (
        <HStack position="absolute" bottom={0} left={0}>
          <Button
            isDisabled={pageNumber === "0"}
            onClick={handleGoToPrevPage}
            leftIcon={<ChevronLeftIcon />}
          >
            Prevous
          </Button>
          <Button
            isDisabled={linksCount < 20}
            onClick={handleGoToNextPage}
            rightIcon={<ChevronRightIcon />}
          >
            Next
          </Button>
        </HStack>
      )}
    </Box>
  );
}
