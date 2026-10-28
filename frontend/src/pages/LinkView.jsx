import React, { useEffect, useRef, useState } from "react";
import { Link as RouterLink, useParams, useHistory } from "react-router-dom";
import {
  Heading,
  Box,
  HStack,
  Text,
  Tag,
  VStack,
  Wrap,
  Button,
  Skeleton,
  IconButton,
  Flex,
  Link,
  Spinner,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  EditIcon,
  ExternalLinkIcon,
  ArrowDownIcon,
} from "@chakra-ui/icons";

import { useLink, useLinkOperations } from "../hooks/links";
import { useDebounce, useScrollDirection } from "../hooks/utils";
import Textarea from "../components/Textarea";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import LinkItemFavicon from "../components/LinkItemFavicon";
import CoverImage from "../components/CoverImage";
import LinkControlsMenu from "../components/LinkControlsMenu";
import InlineTagEditor from "../components/InlineTagEditor";
import {
  DotDotDotVert,
  MaximizeIcon,
  MinimizeIcon,
} from "../components/CustomIcons";
import { HEADER_HEIGHT, HEADER_HEIGHT_MOBILE } from "../theme/theme";
import { useFilters } from "../hooks/filters";
import { useChatContext } from "../hooks/chat";
import { isoDateToAtTimeOnDate, isoDateToShortDate } from "../utils/time";

const NOTE_PANEL_NORMAL = "normal";
const NOTE_PANEL_MAXIMIZED = "maximized";
const NOTE_PANEL_HIDDEN = "hidden";

function getNotePanelMaxHeight(state) {
  switch (state) {
    case NOTE_PANEL_MAXIMIZED:
      return "calc(100vh - 8rem)";
    case NOTE_PANEL_HIDDEN:
      return "0.0rem";
    case NOTE_PANEL_NORMAL:
    default:
      return "13rem";
  }
}

function getNotePanelHeight(state) {
  switch (state) {
    case NOTE_PANEL_MAXIMIZED:
      return "100vh";
    case NOTE_PANEL_HIDDEN:
    case NOTE_PANEL_NORMAL:
    default:
      return "100%";
  }
}

export default function LinkView() {
  const history = useHistory();
  const hasLoadedAnnotationRef = useRef();
  const { linkId } = useParams();
  const {
    data: link = {},
    isLoading,
    isError,
    error,
    isFetched,
  } = useLink(linkId, {
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const { handleSaveAnnotation, isSavingAnnotation, handleGenerateSummary, isGeneratingSummary } = useLinkOperations(link);
  const [annotation, setAnnotation] = useState("");
  const debouncedAnnotation = useDebounce(annotation, 1000);
  const [notePanelState, setNotePanelState] = useState(NOTE_PANEL_HIDDEN);
  const notePanelMaxHeight = getNotePanelMaxHeight(notePanelState);
  const notePanelHeight = getNotePanelHeight(notePanelState);
  const scrollDirection = useScrollDirection();
  const { makeTagLink } = useFilters();
  const { isChatVisible } = useChatContext();
  // The sidebar takes 18rem from lg up; the chat panel takes 25rem at 2xl
  // when it is open. Fixed bars must subtract exactly what is on screen.
  const columnWidth = [
    "100vw",
    "100vw",
    "100vw",
    "100vw",
    "calc(100vw - 18rem)",
    isChatVisible ? "calc(100vw - 18rem - 25rem)" : "calc(100vw - 18rem)",
  ];
  const columnLeft = ["0", "0", "0", "0", "18rem", "18rem"];
  const hasSummary = link.isSummarized

  useEffect(() => {
    if (isFetched && !isError && !isGeneratingSummary && !hasSummary) {
      handleGenerateSummary();
    }
  }, [isFetched, isError, hasSummary, isGeneratingSummary, handleGenerateSummary]);

  // Handle initial retrieval of annotation...
  useEffect(() => {
    if (isFetched && !hasLoadedAnnotationRef.current) {
      setAnnotation(link.annotation);
      hasLoadedAnnotationRef.current = Date.now();
    }
  }, [isFetched, link.annotation, hasLoadedAnnotationRef]);

  useEffect(() => {
    if (
      // The time difference accounts for the debounce delay
      Date.now() - hasLoadedAnnotationRef.current > 1500 &&
      link.annotation !== debouncedAnnotation &&
      !isSavingAnnotation
    ) {
      handleSaveAnnotation(debouncedAnnotation);
    }
  }, [
    debouncedAnnotation,
    handleSaveAnnotation,
    hasLoadedAnnotationRef,
    link.annotation,
    isSavingAnnotation,
  ]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  return (
    <Box>
      <Box
        position="fixed"
        top={[HEADER_HEIGHT_MOBILE, HEADER_HEIGHT_MOBILE, HEADER_HEIGHT_MOBILE, HEADER_HEIGHT_MOBILE, HEADER_HEIGHT]}
        left={columnLeft}
        width={columnWidth}
        paddingY={2}
        borderBottomWidth="thin"
        borderBottomColor="gray.100"
        backgroundColor="white"
        zIndex={1}
        translateY={scrollDirection === "DOWN" ? "-8rem" : "0"}
        transform="auto"
        transition="transform ease 0.2s"
      >
        <HStack maxWidth="5xl" marginX="auto" width="100%" paddingX={[4, 4, 4, 4, 6]} spacing={2}>
          <IconButton
            size="sm"
            onClick={() => history.goBack()}
            icon={<ArrowBackIcon />}
            aria-label="Back"
          />
          <Button
            size="sm"
            onClick={() => history.replace(`/links/${link.id}/update`)}
            leftIcon={<EditIcon boxSize="3" />}
          >
            Edit
          </Button>
          <Button
            size="sm"
            as={Link}
            isExternal={true}
            href={link.url}
            leftIcon={<ExternalLinkIcon boxSize="3" />}
          >
            Visit
          </Button>
          <LinkControlsMenu
            link={link}
            buttonSlot={<IconButton size="sm" as={Box} icon={<DotDotDotVert />} aria-label="More actions" />}
          />
        </HStack>
      </Box>

      <Box maxWidth="5xl" marginX="auto">
        <Box maxWidth="50rem">
          <VStack
            paddingX={[4, 4, 4, 4, 6]}
            paddingTop={6}
            spacing={6}
            align="left"
            position="relative"
          >
            {/* Room for the fixed toolbar. */}
            <Box height="2rem" />

            {/* Title block: site, title, when it was saved. */}
            <VStack align="left" spacing={2}>
              {/*
                One line at every width: the favicon, divider and date are
                fixed-width pieces; only the site name shrinks and truncates.
                A single columnGap keeps every adjacent pair 0.5rem apart.
              */}
              <Flex
                wrap="nowrap"
                align="center"
                columnGap={2}
                minW={0}
                color="gray.700"
                fontSize="sm"
                lineHeight="1.4"
              >
                {/* The shared favicon carries its own right margin and a
                    1.3rem box for card rows; here it sits inside 14px text,
                    so it is sized to the line and the margin is dropped. */}
                <LinkItemFavicon
                  favicon={link.favicon}
                  height="1rem"
                  width="1rem"
                  marginRight={0}
                />
                <Text as="span" minW={0} isTruncated>
                  {link.site}
                </Text>
                <Text as="span" color="gray.400" aria-hidden="true" flexShrink={0}>
                  ·
                </Text>
                <Text
                  as="time"
                  dateTime={link.createdAt}
                  whiteSpace="nowrap"
                  flexShrink={0}
                  title={`Saved ${isoDateToAtTimeOnDate(link.createdAt)}`}
                >
                  <Text as="span" display={{ base: "inline", md: "none" }}>
                    Saved {isoDateToShortDate(link.createdAt)}
                  </Text>
                  <Text as="span" display={{ base: "none", md: "inline" }}>
                    Saved {isoDateToAtTimeOnDate(link.createdAt)}
                  </Text>
                </Text>
              </Flex>
              <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.02em" lineHeight="1.2">
                {link.title}
              </Heading>
            </VStack>

            {link.image && (
              <Box
                height={{ base: "14rem", md: "22rem" }}
                borderRadius="lg"
                overflow="hidden"
                borderColor="gray.100"
                borderWidth="thin"
              >
                <CoverImage
                  link={link}
                  width="100%"
                  height="100%"
                  fallback={<Skeleton height="100%" width="100%" />}
                />
              </Box>
            )}

            {/* Tags: personal first (editable), then auto tags as links. */}
            <Wrap spacing={2} align="center">
              <InlineTagEditor linkId={link.id} />
              {link.tagDetails.map((detail) => (
                <Tag
                  as={RouterLink}
                  to={makeTagLink(detail.path.slice(1, detail.path.length))}
                  key={detail.path}
                  size="lg"
                  height="8"
                  px={3}
                  fontSize="sm"
                  fontWeight="semibold"
                  whiteSpace="nowrap"
                  borderRadius="lg"
                  bg="gray.100"
                  color="gray.800"
                  transition="background-color 0.2s ease"
                  _hover={{ backgroundColor: "gray.200" }}
                  title="Auto tag"
                >
                  {detail.path.slice(1, detail.path.length).replaceAll("/", " → ")}
                </Tag>
              ))}
            </Wrap>

            {/* Summary: the assistant's take, shown only when it exists or is on its way. */}
            {(hasSummary && link.summary && link.summary.length > 0) || isGeneratingSummary ? (
              <Box
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                px={5}
                py={4}
              >
                <HStack spacing={2} mb={2}>
                  <Heading as="h2" fontSize="sm" color="gray.800">
                    Summary
                  </Heading>
                  {isGeneratingSummary && (
                    <HStack spacing={1.5} fontSize="xs" color="gray.600">
                      <Spinner size="xs" thickness="2px" color="brand.500" emptyColor="brand.100" />
                      <Text as="span">Writing…</Text>
                    </HStack>
                  )}
                </HStack>
                {hasSummary && link.summary && link.summary.length > 0 ? (
                  <Box
                    className="prose prose-sans-serif prose-1rem"
                    dangerouslySetInnerHTML={{ __html: link.summary }}
                  />
                ) : (
                  <Text fontSize="sm" color="gray.600">
                    The assistant is reading this link.
                  </Text>
                )}
              </Box>
            ) : null}

            {/* The article itself. */}
            <VStack align="left" spacing={3} paddingBottom="2rem">
              <Heading as="h2" fontSize="sm" color="gray.800">
                Article
              </Heading>
              {link.corpus.length > 1024 ? (
                <Box
                  className="prose"
                  maxWidth="65ch"
                  dangerouslySetInnerHTML={{
                    __html: link.corpus
                      .replaceAll("<html>", "")
                      .replaceAll("<head>", "")
                      .replaceAll("<body>", "")
                      .replaceAll("</head>", "")
                      .replaceAll("</html>", "")
                      .replaceAll("</body>", ""),
                  }}
                />
              ) : link.description.length > 0 ? (
                <Text maxWidth="65ch" color="gray.800">
                  {link.description}
                </Text>
              ) : (
                <Text color="gray.600" maxWidth="65ch">
                  We couldn't read this page's text, so there's nothing to show here yet.{" "}
                  <Link href={link.url} isExternal color="brand.500" fontWeight="semibold">
                    Open the original
                  </Link>
                  .
                </Text>
              )}
            </VStack>

            {/* Room for the fixed note bar. */}
            <Box height="10rem" />
          </VStack>
        </Box>
      </Box>

      <Box
        position="fixed"
        bottom={0}
        left={columnLeft}
        width={columnWidth}
        borderTopWidth="thin"
        borderTopColor="gray.100"
        backgroundColor="white"
        zIndex={1}
      >
        <Box maxWidth="5xl" marginX="auto" paddingX={[4, 4, 4, 4, 6]}>
          <Box
            maxHeight={notePanelMaxHeight}
            height={notePanelHeight}
            overflowY="scroll"
          >
            <Textarea
              cols={[40, 50, 70, 70]}
              minRows={2}
              maxRows={Infinity}
              width="100%"
              maxWidth={["calc(100vw - 3rem)", "70ch", "70ch"]}
              paddingTop={4}
              placeholder="Start typing to add a note…"
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
            />
          </Box>

          <Flex
            maxWidth={["calc(100vw - 2rem)", "70ch", "70ch"]}
            width="100%"
            paddingY={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <HStack spacing={2}>
              {notePanelState === NOTE_PANEL_HIDDEN ? (
                <Button
                  size="sm"
                  leftIcon={<EditIcon boxSize="3" />}
                  onClick={() => setNotePanelState(NOTE_PANEL_NORMAL)}
                >
                  {annotation && annotation.length > 0 ? "Show note" : "Add a note"}
                </Button>
              ) : (
                <>
                  <IconButton
                    size="sm"
                    aria-label="Hide note"
                    icon={<ArrowDownIcon />}
                    onClick={() => setNotePanelState(NOTE_PANEL_HIDDEN)}
                  />
                  <IconButton
                    size="sm"
                    aria-label={notePanelState === NOTE_PANEL_MAXIMIZED ? "Shrink note" : "Expand note"}
                    icon={notePanelState === NOTE_PANEL_MAXIMIZED ? <MinimizeIcon /> : <MaximizeIcon />}
                    onClick={() =>
                      setNotePanelState(
                        notePanelState === NOTE_PANEL_MAXIMIZED ? NOTE_PANEL_NORMAL : NOTE_PANEL_MAXIMIZED
                      )
                    }
                  />
                  <Text as="span" fontSize="sm" fontWeight="semibold" color="gray.800" pl={1}>
                    Note
                  </Text>
                </>
              )}
            </HStack>
            <Flex alignItems="center">
              {notePanelState !== NOTE_PANEL_HIDDEN && (
                <Text fontSize="sm" color="gray.600" padding={0} margin={0}>
                  {isSavingAnnotation ? "Saving…" : "Saved"}
                </Text>
              )}
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
