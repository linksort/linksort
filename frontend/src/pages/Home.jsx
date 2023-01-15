import React from "react";
import { Box, Heading, HStack, Button, List, Grid } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

import ErrorScreen from "../components/ErrorScreen";
import NullScreen from "../components/NullScreen";
import LoadingScreen from "../components/LoadingScreen";
import LinkItem from "../components/LinkItem";
import ScrollToTop from "../components/ScrollToTop";
import { useLinks } from "../hooks/links";
import { useFilters, GROUP_BY_OPTION_DAY } from "../hooks/filters";
import { isoDateToHeading } from "../utils/time";
import {
  useViewSetting,
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
} from "../hooks/views";
import { useTour } from "../hooks/tour";

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
            "repeat(3, 1fr)",
            "repeat(3, 1fr)",
            "repeat(3, 1fr)",
          ]}
          marginBottom={16}
        >
          {children}
        </List>
      );
    case VIEW_SETTING_CONDENSED:
      return <List marginBottom={6}>{children}</List>;
    case VIEW_SETTING_TALL:
    default:
      return <List marginBottom={14}>{children}</List>;
  }
}

export default function Home() {
  const { setting: viewSetting } = useViewSetting();
  const {
    data: links,
    isError,
    error,
    isLoading,
    isFetching,
    isFetched,
    isStale,
    failureCount,
  } = useLinks();
  const {
    handleGoToNextPage,
    handleGoToPrevPage,
    handleSearch,
    groupName,
    pageNumber,
    searchQuery,
  } = useFilters();
  const linksCount = links.length;
  const isSearching = searchQuery && searchQuery.length > 0;
  const isViewSettingCondensed = viewSetting === VIEW_SETTING_CONDENSED;

  useTour();

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  if (isLoading || failureCount > 0 || (isFetching && isStale && !isFetched)) {
    return <LoadingScreen />;
  }

  if (linksCount === 0 && !isFetching) {
    return <NullScreen />;
  }

  return (
    <Box
      maxWidth="5xl"
      marginX="auto"
      minHeight="calc(100vh - 6.5rem)"
      position="relative"
      paddingX={6}
      paddingY={6}
      marginBottom={6}
      overflow="hidden"
    >
      <ScrollToTop />
      <Box marginBottom={8}>
        {Object.entries(linksBy(groupName, links)).map(([heading, list]) => {
          return (
            <Box as="section" key={heading}>
              {heading !== "all" && (
                <Heading
                  as="h3"
                  size={isViewSettingCondensed ? "sm" : "md"}
                  marginBottom={isViewSettingCondensed ? 2 : 6}
                >
                  {heading}
                </Heading>
              )}
              <LinkList viewSetting={viewSetting}>
                {list.map((link, idx) => (
                  <LinkItem key={link.id} idx={idx} link={link} />
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
        <HStack position="absolute" bottom={1} left={6}>
          <Button
            isDisabled={pageNumber === "0"}
            onClick={handleGoToPrevPage}
            leftIcon={<ChevronLeftIcon />}
          >
            Prevous
          </Button>
          <Button onClick={handleGoToNextPage} rightIcon={<ChevronRightIcon />}>
            Next
          </Button>
        </HStack>
      )}
    </Box>
  );
}
