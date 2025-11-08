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
  ArrowUpIcon,
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
import { useFilters } from "../hooks/filters";
import { isoDateToAtTimeOnDate } from "../utils/time";

const NOTE_PANEL_NORMAL = "normal";
const NOTE_PANEL_MAXIMIZED = "maximized";
const NOTE_PANEL_HIDDEN = "hidden";

function getNotePanelMaxHeight(state) {
  switch (state) {
    case NOTE_PANEL_MAXIMIZED:
      return "calc(100vh - 7.5rem)";
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
        paddingY={6}
        borderBottomWidth="thin"
        borderBottomColor="gray.100"
        backgroundColor="white"
        zIndex={1}
        width="100%"
        maxWidth={[
          "calc(100vw)",
          "calc(100vw)",
          "calc(100vw)",
          "calc(100vw)",
          "calc(100vw - 18rem)",
          "calc(100vw - 18rem - 25rem)",
        ]}
        translateY={scrollDirection === "DOWN" ? "-6rem" : "0"}
        transform="auto"
        transition="transform ease 0.2s"
      >
        <HStack maxWidth="5xl" marginX="auto" width="100%" paddingX={6}>
          <IconButton
            onClick={() => history.goBack()}
            icon={<ArrowBackIcon />}
          />
          <Button
            onClick={() => history.replace(`/links/${link.id}/update`)}
            leftIcon={<EditIcon />}
          >
            Edit
          </Button>
          <Button
            as={Link}
            isExternal={true}
            href={link.url}
            leftIcon={<ExternalLinkIcon />}
          >
            Visit
          </Button>
          <LinkControlsMenu
            link={link}
            buttonSlot={<IconButton as={Box} icon={<DotDotDotVert />} />}
          />
        </HStack>
      </Box>

      <Box maxWidth="5xl" marginX="auto">
        <Box maxWidth="50rem">
          <VStack
            paddingX={6}
            paddingTop={6}
            spacing={6}
            align="left"
            position="relative"
          >
            <Box height="4rem" />

            <VStack align="left">
              <HStack spacing={0}>
                <LinkItemFavicon favicon={link.favicon} />
                <Text>{link.site}</Text>
              </HStack>
              <Heading as="h1">{link.title}</Heading>
            </VStack>

            {link.image && (
              <Box
                height="22rem"
                borderRadius="lg"
                overflow="hidden"
                borderColor="gray.100"
                borderWidth="thin"
              >
                <CoverImage
                  link={link}
                  width="100%"
                  height="22rem"
                  fallback={<Skeleton height="100%" width="100%" />}
                />
              </Box>
            )}

            <VStack align="left">
              <Heading as="h6" fontSize="sm">
                Saved At
              </Heading>
              <Text>{isoDateToAtTimeOnDate(link.createdAt)}</Text>
            </VStack>

            <VStack align="left">
              <Heading as="h6" fontSize="sm">
                Description
              </Heading>

              {link.description.length > 0 ? (
                <Text>{link.description}</Text>
              ) : (
                <Text color="gray.600">
                  No description was found for this link.
                </Text>
              )}
            </VStack>

            <VStack align="left">
              <Heading as="h6" fontSize="sm">
                Personal Tags
              </Heading>
              <InlineTagEditor linkId={link.id} />
            </VStack>

            <VStack align="left">
              <Heading as="h6" fontSize="sm">
                Auto Tags
              </Heading>
              {link.tagDetails.length > 0 ? (
                <Wrap>
                  {link.tagDetails.map((detail) => (
                    <Tag
                      as={RouterLink}
                      to={makeTagLink(detail.path.slice(1, detail.path.length))}
                      key={detail.path}
                      marginRight={2}
                      whiteSpace="nowrap"
                      overflow="hidden"
                      transition="all 0.2s"
                      padding={2}
                      _hover={{ backgroundColor: "gray.200" }}
                    >
                      {detail.path
                        .slice(1, detail.path.length)
                        .replaceAll("/", " -> ")}
                    </Tag>
                  ))}
                </Wrap>
              ) : (
                <Text color="gray.600">
                  No auto tags were assigned to this link.
                </Text>
              )}
            </VStack>

            <VStack align="left">
              <Heading as="h6" fontSize="sm">
                Summary
              </Heading>
              {hasSummary && link && link.summary && link.summary.length > 0 ? (
                <Box className="prose prose-sans-serif prose-1rem" dangerouslySetInnerHTML={{ __html: link.summary }} />
              ) : (
                <>
                  {isGeneratingSummary ? (
                    <Spinner />
                  ) : (
                    <Text color="gray.600">
                      No summary was generated for this link.
                    </Text>
                  )}
                </>
              )}
            </VStack>

            <VStack align="left" paddingBottom="5rem">
              <Heading as="h6" fontSize="sm">
                Corpus
              </Heading>
              {link.corpus.length > 1024 ? (
                <Box
                  className="prose"
                  width="60ch"
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
              ) : (
                <Text color="gray.600">
                  No corpus was gathered for this link.
                </Text>
              )}
            </VStack>

            <Box height="14rem" />
          </VStack>
        </Box>
      </Box>

      <Box
        position="fixed"
        bottom={0}
        left="auto"
        width="100%"
        maxWidth={[
          "calc(100vw)",
          "calc(100vw)",
          "calc(100vw)",
          "calc(100vw)",
          "calc(100vw - 18rem)",
        ]}
        borderTopWidth="thin"
        borderTopColor="gray.100"
        backgroundColor="white"
      >
        <Box
          width={8}
          borderTopWidth="thin"
          borderTopColor="gray.100"
          marginLeft="-1.6rem"
          marginTop="-1px"
        />

        <Box maxWidth="5xl" marginX="auto" paddingX={5}>
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
              placeholder="Start typing to add a note..."
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
            />
          </Box>

          <Flex
            maxWidth={["calc(100vw - 3rem)", "70ch", "70ch"]}
            width="100%"
            padding={1}
            justifyContent="space-between"
          >
            <HStack>
              <IconButton
                size="sm"
                icon={
                  notePanelState === NOTE_PANEL_MAXIMIZED ? (
                    <MinimizeIcon />
                  ) : (
                    <MaximizeIcon />
                  )
                }
                onClick={() =>
                  setNotePanelState(
                    notePanelState === NOTE_PANEL_MAXIMIZED
                      ? NOTE_PANEL_NORMAL
                      : NOTE_PANEL_MAXIMIZED
                  )
                }
              />
              <IconButton
                size="sm"
                icon={
                  notePanelState === NOTE_PANEL_HIDDEN ? (
                    <ArrowUpIcon />
                  ) : (
                    <ArrowDownIcon />
                  )
                }
                onClick={() =>
                  setNotePanelState(
                    notePanelState === NOTE_PANEL_HIDDEN
                      ? NOTE_PANEL_NORMAL
                      : NOTE_PANEL_HIDDEN
                  )
                }
              />
            </HStack>
            <Flex alignItems="center">
              <Text fontSize="sm" color="gray.500" padding={0} margin={0}>
                {isSavingAnnotation ? "Saving..." : "Saved"}
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
