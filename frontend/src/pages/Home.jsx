import React from "react";
import {
  Box,
  Heading,
  HStack,
  Button,
  Stack,
  Skeleton,
  List,
  Grid,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

import ErrorScreen from "../components/ErrorScreen";
import LinkItem from "../components/LinkItem";
import { useLinks } from "../hooks/links";
import {
  useFilters,
  GROUP_BY_OPTION_DAY,
  GROUP_BY_OPTION_SITE,
} from "../hooks/filters";
import { isoDateToHeading } from "../utils/time";
import {
  useViewSetting,
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
} from "../hooks/views";

function linksBy(grouping, links) {
  switch (grouping) {
    case GROUP_BY_OPTION_DAY:
      return links.reduce((acc, cur) => {
        const date = isoDateToHeading(cur.createdAt);
        if (acc[date]) {
          acc[date].push(cur);
        } else {
          acc[date] = [cur];
        }
        return acc;
      }, {});
    case GROUP_BY_OPTION_SITE:
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

function LinkList({ viewSetting, children }) {
  switch (viewSetting) {
    case VIEW_SETTING_TILES:
      return (
        <List
          as={Grid}
          gap={6}
          templateColumns={[
            "repeat(1, 1fr)",
            "repeat(2, 1fr)",
            "repeat(2, 1fr)",
            "repeat(2, 1fr)",
            "repeat(3, 1fr)",
          ]}
          marginBottom={14}
        >
          {children}
        </List>
      );
    case VIEW_SETTING_CONDENSED:
      return <List marginBottom={6}>{children}</List>;
    case VIEW_SETTING_TALL:
      return <List marginBottom={10}>{children}</List>;
    default:
      return <List>{children}</List>;
  }
}

export default function Home() {
  const { setting: viewSetting } = useViewSetting();
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
                <Heading
                  as="h3"
                  size={viewSetting === VIEW_SETTING_CONDENSED ? "sm" : "md"}
                  marginBottom={viewSetting === VIEW_SETTING_CONDENSED ? 2 : 6}
                >
                  {heading}
                </Heading>
              )}
              <LinkList viewSetting={viewSetting}>
                {list.map((link) => (
                  <LinkItem key={link.id} link={link} />
                ))}
              </LinkList>
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
