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
import { useHistory } from "react-router-dom";

import ErrorScreen from "../components/ErrorScreen";
import LinkItem from "../components/LinkItem";
import { useLinks } from "../hooks/links";
import { useFilterParams, usePagination } from "../hooks/filters";
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
  const { goBack } = useHistory();
  const { data: links, isError, error, isLoading } = useLinks();
  const filterParams = useFilterParams();
  const { nextPage, prevPage } = usePagination();

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
      <HStack marginTop={8}>
        {filterParams.search && filterParams.search.length > 0 ? (
          <Button onClick={goBack}>Go back</Button>
        ) : (
          <>
            <Button onClick={prevPage} leftIcon={<ChevronLeftIcon />}>
              Prevous
            </Button>
            <Button onClick={nextPage} rightIcon={<ChevronRightIcon />}>
              Next
            </Button>
          </>
        )}
      </HStack>
    </Box>
  );
}
