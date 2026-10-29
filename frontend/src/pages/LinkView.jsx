import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useParams, useHistory, useLocation } from "react-router-dom";
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
  Drawer,
  DrawerOverlay,
  DrawerContent,
} from "@chakra-ui/react";
import { ArrowBackIcon, EditIcon, ExternalLinkIcon } from "@chakra-ui/icons";

import { useLink, useLinkOperations } from "../hooks/links";
import { useHighlights } from "../hooks/highlights";
import { useDebounce, useScrollDirection, useMatchMedia } from "../hooks/utils";
import { useLocalStorage } from "../hooks/localStorage";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import LinkItemFavicon from "../components/LinkItemFavicon";
import CoverImage from "../components/CoverImage";
import LinkControlsMenu from "../components/LinkControlsMenu";
import InlineTagEditor from "../components/InlineTagEditor";
import NotebookPanel from "../components/NotebookPanel";
import SelectionToolbar from "../components/SelectionToolbar";
import HighlightPopover from "../components/HighlightPopover";
import { DotDotDotVert, HighlighterIcon } from "../components/CustomIcons";
import { HEADER_HEIGHT, HEADER_HEIGHT_MOBILE } from "../theme/theme";
import { useFilters } from "../hooks/filters";
import { useChatContext } from "../hooks/chat";
import { isoDateToAtTimeOnDate, isoDateToShortDate } from "../utils/time";
import {
  applyHighlights,
  describeSelection,
  locate,
  marksFor,
  textIndex,
  findQuote,
  wrapRange,
  unwrapAll,
  HIGHLIGHT_ATTR,
} from "../utils/highlights";

// Same six-slot responsive arrays as the toolbar below: the column exists
// from the breakpoint where the sidebar appears (slot 4, lg).
const NOTEBOOK_WIDTH = ["100%", "100%", "100%", "100%", "20rem", "20rem"];
const TOOLBAR_HEIGHT = "3rem";
const FLASH_MS = 600;
const PENDING_ID = "pending";

function readHashHighlight(hash) {
  const m = /[#&]h=([^&]+)/.exec(hash || "");
  return m ? decodeURIComponent(m[1]) : null;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

function isCoarsePointer() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(pointer: coarse)").matches
    : false;
}

export default function LinkView() {
  const history = useHistory();
  const location = useLocation();
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
  const { handleSaveAnnotation, isSavingAnnotation, handleGenerateSummary, isGeneratingSummary } =
    useLinkOperations(link);
  const { createHighlight, updateHighlightNote, removeHighlight, isCreating } = useHighlights(linkId);
  const [annotation, setAnnotation] = useState("");
  const debouncedAnnotation = useDebounce(annotation, 1000);
  const scrollDirection = useScrollDirection();
  const { makeTagLink } = useFilters();
  const { isChatVisible } = useChatContext();
  // The Notebook is a column when the content column (viewport minus the
  // 18rem sidebar and, when on screen, the 25rem chat panel) can spare 20rem
  // and still leave the article 44rem; otherwise it is a bottom drawer. The
  // chat column only renders from 80rem, whatever its toggle says.
  const atLg = useMatchMedia("(min-width: 64rem)");
  const atXl = useMatchMedia("(min-width: 80rem)");
  const roomForChatAndNotebook = useMatchMedia("(min-width: 87rem)");
  const chatOnScreen = isChatVisible && atXl;
  const isWide = atLg && (!chatOnScreen || roomForChatAndNotebook);

  // Notebook visibility: the user's last choice wins; otherwise it opens on
  // wide screens when there is already something written about the link.
  const [notebookPref, setNotebookPref] = useLocalStorage("isNotebookVisible", null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isNotebookOpen = isWide
    ? notebookPref === null
      ? Boolean(link.isAnnotated)
      : notebookPref
    : isDrawerOpen;

  // Highlight UI state.
  const articleRef = useRef(null);
  const noteRef = useRef(null);
  const isSelectingRef = useRef(false);
  const [applyVersion, setApplyVersion] = useState(0);
  const [orderedIds, setOrderedIds] = useState([]);
  const [orphanedIds, setOrphanedIds] = useState(() => new Set());
  const [selection, setSelection] = useState(null); // { quote, rect }
  const [popover, setPopover] = useState(null); // { id, rect }
  const [editingHighlightId, setEditingHighlightId] = useState(null);
  const hashHandledRef = useRef(false);
  const isTouch = useMemo(isCoarsePointer, []);

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
  const headerHeight = [
    HEADER_HEIGHT_MOBILE,
    HEADER_HEIGHT_MOBILE,
    HEADER_HEIGHT_MOBILE,
    HEADER_HEIGHT_MOBILE,
    HEADER_HEIGHT,
  ];
  const hasSummary = link.isSummarized;
  const highlights = useMemo(() => link.highlights || [], [link.highlights]);
  const hasCorpus = (link.corpus || "").length > 1024;
  const hasDescription = (link.description || "").length > 0;
  const hasArticle = hasCorpus || hasDescription;
  const articleHtml = useMemo(
    () =>
      hasCorpus
        ? link.corpus
            .replaceAll("<html>", "")
            .replaceAll("<head>", "")
            .replaceAll("<body>", "")
            .replaceAll("</head>", "")
            .replaceAll("</html>", "")
            .replaceAll("</body>", "")
        : "",
    [hasCorpus, link.corpus]
  );

  // Highlights in document order (orphans last, in creation order).
  const orderedHighlights = useMemo(() => {
    const byId = new Map(highlights.map((h) => [h.id, h]));
    const seen = new Set();
    const out = [];
    orderedIds.forEach((id) => {
      if (byId.has(id)) {
        out.push(byId.get(id));
        seen.add(id);
      }
    });
    highlights.forEach((h) => {
      if (!seen.has(h.id)) out.push(h);
    });
    return out;
  }, [highlights, orderedIds]);

  const notebookCount = highlights.length + (annotation && annotation.length > 0 ? 1 : 0);
  const popoverHighlight = popover ? highlights.find((h) => h.id === popover.id) : null;

  useEffect(() => {
    if (isFetched && !isError && !isGeneratingSummary && !hasSummary) {
      handleGenerateSummary();
    }
  }, [isFetched, isError, hasSummary, isGeneratingSummary, handleGenerateSummary]);

  // Handle initial retrieval of annotation...
  useEffect(() => {
    if (isFetched && !hasLoadedAnnotationRef.current) {
      setAnnotation(link.annotation || "");
      hasLoadedAnnotationRef.current = Date.now();
    }
  }, [isFetched, link.annotation, hasLoadedAnnotationRef]);

  useEffect(() => {
    if (
      // The time difference accounts for the debounce delay
      Date.now() - hasLoadedAnnotationRef.current > 1500 &&
      (link.annotation || "") !== debouncedAnnotation &&
      !isSavingAnnotation
    ) {
      handleSaveAnnotation(debouncedAnnotation);
    }
  }, [debouncedAnnotation, handleSaveAnnotation, hasLoadedAnnotationRef, link.annotation, isSavingAnnotation]);

  // Apply the highlights to the article whenever they or the article change.
  // Deferred while the user is dragging out a selection, since rewrapping
  // would collapse it.
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return undefined;

    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      const orphans = applyHighlights(root, highlights);
      const index = textIndex(root);
      const positions = highlights
        .filter((h) => !orphans.has(h.id))
        .map((h) => ({ id: h.id, pos: findQuote(index.text, h) }))
        .sort((a, b) => a.pos - b.pos)
        .map((p) => p.id);
      setOrderedIds(positions);
      setOrphanedIds(orphans);
    };

    if (isSelectingRef.current) {
      const onUp = () => {
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchend", onUp);
        setTimeout(run, 0);
      };
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchend", onUp);
      return () => {
        cancelled = true;
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchend", onUp);
      };
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [highlights, articleHtml, hasDescription, applyVersion]);

  const flashHighlight = useCallback((id) => {
    const marks = marksFor(articleRef.current, id);
    if (marks.length === 0) return false;
    marks.forEach((m) => m.classList.add("ls-highlight--flash"));
    setTimeout(() => marks.forEach((m) => m.classList.remove("ls-highlight--flash")), FLASH_MS);
    return true;
  }, []);

  const scrollToHighlight = useCallback(
    (id) => {
      const marks = marksFor(articleRef.current, id);
      if (marks.length === 0) return false;
      marks[0].scrollIntoView({
        block: "center",
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
      flashHighlight(id);
      return true;
    },
    [flashHighlight]
  );

  // /links/{id}#h={highlightId}: scroll to the highlight once it is on the page.
  useEffect(() => {
    if (hashHandledRef.current) return;
    const id = readHashHighlight(location.hash);
    if (!id || orderedIds.length === 0) return;
    if (!orderedIds.includes(id)) return;
    hashHandledRef.current = true;
    if (isWide) setNotebookPref(true);
    // Let the page lay out (cover image, summary) before measuring.
    setTimeout(() => scrollToHighlight(id), 50);
  }, [location.hash, orderedIds, scrollToHighlight, isWide, setNotebookPref]);

  // Keep the article's active mark in sync with the popover.
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return undefined;
    const active = popover ? marksFor(root, popover.id) : [];
    active.forEach((m) => m.classList.add("ls-highlight--active"));
    return () => active.forEach((m) => m.classList.remove("ls-highlight--active"));
  }, [popover, orderedIds]);

  // Selection toolbar: follow the selection inside the article.
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return undefined;

    let timer = null;

    const update = () => {
      const sel = window.getSelection();
      const quote = describeSelection(root, sel);
      if (!quote) {
        setSelection(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelection({ quote, rect });
      setPopover(null);
    };

    const scheduleUpdate = () => {
      clearTimeout(timer);
      timer = setTimeout(update, 150);
    };

    const onDown = () => {
      isSelectingRef.current = true;
    };
    const onUp = () => {
      isSelectingRef.current = false;
      scheduleUpdate();
    };
    // Follow the selection while it is on screen; drop the pill once it has
    // scrolled away (a detached pill would float over unrelated text).
    const onScroll = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      setSelection((prev) => (prev && visible ? { ...prev, rect } : null));
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelection(null);
        setPopover(null);
      }
    };

    document.addEventListener("selectionchange", scheduleUpdate);
    root.addEventListener("mousedown", onDown);
    root.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("selectionchange", scheduleUpdate);
      root.removeEventListener("mousedown", onDown);
      root.removeEventListener("touchstart", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [articleHtml, hasDescription]);

  // Clicking or activating a mark opens its popover.
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return undefined;

    const open = (mark) => {
      const id = mark.getAttribute(HIGHLIGHT_ATTR);
      if (!id || id === PENDING_ID) return;
      const first = marksFor(root, id)[0] || mark;
      setSelection(null);
      setPopover({ id, rect: first.getBoundingClientRect() });
    };

    const onClick = (e) => {
      const mark = e.target.closest && e.target.closest("mark.ls-highlight");
      if (!mark) return;
      // Don't hijack a drag-selection that ended on a mark.
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      // Links inside highlights stay clickable; the popover opens via keyboard
      // or by clicking non-link text.
      if (e.target.closest("a")) return;
      e.preventDefault();
      open(mark);
    };

    const onKeyDown = (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const mark = e.target.closest && e.target.closest("mark.ls-highlight");
      if (!mark) return;
      e.preventDefault();
      open(mark);
    };

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [articleHtml, hasDescription]);

  // Close the popover on scroll or outside click.
  useEffect(() => {
    if (!popover) return undefined;
    const onScroll = () => setPopover(null);
    const onPointerDown = (e) => {
      if (e.target.closest && (e.target.closest("[data-testid='highlight-popover']") || e.target.closest("mark.ls-highlight"))) {
        return;
      }
      setPopover(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [popover]);

  function closePopover() {
    if (popover) {
      const mark = marksFor(articleRef.current, popover.id)[0];
      if (mark) mark.focus({ preventScroll: true });
    }
    setPopover(null);
  }

  function openNotebook() {
    if (isWide) {
      setNotebookPref(true);
    } else {
      setIsDrawerOpen(true);
    }
  }

  function toggleNotebook() {
    if (isWide) {
      setNotebookPref(!isNotebookOpen);
    } else {
      setIsDrawerOpen((v) => !v);
    }
  }

  async function handleCreateHighlight(withNote) {
    if (!selection || !articleRef.current) return;
    const { quote } = selection;
    const root = articleRef.current;

    // Paint it immediately; the server's copy replaces it when it arrives.
    const range = locate(root, quote);
    if (range) wrapRange(range, PENDING_ID);
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    setSelection(null);

    try {
      const data = await createHighlight(quote);
      const created = data.link.highlights[data.link.highlights.length - 1];
      if (withNote && created) {
        setEditingHighlightId(created.id);
        openNotebook();
      }
    } catch (e) {
      unwrapAll(root);
      setApplyVersion((v) => v + 1);
    }
  }

  function handleJumpToHighlight(id) {
    if (!isWide) setIsDrawerOpen(false);
    // On mobile the drawer must close before the article can scroll.
    setTimeout(() => scrollToHighlight(id), isWide ? 0 : 250);
  }

  function handleStartEditHighlight(id) {
    setPopover(null);
    setEditingHighlightId(id);
    openNotebook();
    setTimeout(() => {
      const card = document.querySelector(`[data-highlight-card="${id}"]`);
      if (card) card.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }, 50);
  }

  function handleSaveHighlightNote(id, note) {
    return updateHighlightNote({ highlightId: id, note });
  }

  async function handleRemoveHighlight(id) {
    setPopover(null);
    if (editingHighlightId === id) setEditingHighlightId(null);
    await removeHighlight(id);
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  const notebook = (
    <NotebookPanel
      annotation={annotation}
      onAnnotationChange={setAnnotation}
      isSavingAnnotation={isSavingAnnotation}
      highlights={orderedHighlights}
      orphanedIds={orphanedIds}
      activeHighlightId={popover ? popover.id : null}
      editingHighlightId={editingHighlightId}
      onJumpToHighlight={handleJumpToHighlight}
      onStartEditHighlight={handleStartEditHighlight}
      onSaveHighlightNote={handleSaveHighlightNote}
      onRemoveHighlight={handleRemoveHighlight}
      onClose={isWide ? undefined : () => setIsDrawerOpen(false)}
      noteRef={noteRef}
      hasArticle={hasArticle}
    />
  );

  return (
    <Box>
      <Box
        position="fixed"
        top={headerHeight}
        left={columnLeft}
        width={columnWidth}
        height={TOOLBAR_HEIGHT}
        paddingY={2}
        borderBottomWidth="thin"
        borderBottomColor="gray.100"
        backgroundColor="white"
        zIndex={2}
        translateY={scrollDirection === "DOWN" ? "-8rem" : "0"}
        transform="auto"
        transition="transform ease 0.2s"
      >
        <HStack
          maxWidth="5xl"
          marginX="auto"
          width="100%"
          paddingLeft={[4, 4, 4, 4, 6]}
          paddingRight={isWide && isNotebookOpen ? "calc(20rem + 1.5rem)" : [4, 4, 4, 4, 6]}
          spacing={2}
          justify="space-between"
        >
          <HStack spacing={2} minWidth={0}>
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
          <Button
            size="sm"
            leftIcon={<HighlighterIcon boxSize="3.5" />}
            onClick={toggleNotebook}
            aria-expanded={isNotebookOpen}
            aria-controls="notebook-panel"
            bg={isNotebookOpen ? "gray.200" : "gray.100"}
            flexShrink={0}
          >
            Notebook
            {notebookCount > 0 && (
              <Text as="span" fontWeight="normal" color="gray.600" marginLeft={1.5}>
                · {notebookCount}
              </Text>
            )}
          </Button>
        </HStack>
      </Box>

      <Box maxWidth="5xl" marginX="auto">
        <Box
          maxWidth="50rem"
          marginRight={isWide && isNotebookOpen ? NOTEBOOK_WIDTH : 0}
          transition="margin-right 0.2s ease"
        >
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
            <VStack align="left" spacing={3} paddingBottom="4rem">
              <Heading as="h2" fontSize="sm" color="gray.800">
                Article
              </Heading>
              {hasCorpus ? (
                <Box
                  ref={articleRef}
                  className="prose"
                  maxWidth="65ch"
                  dangerouslySetInnerHTML={{ __html: articleHtml }}
                />
              ) : hasDescription ? (
                <Box ref={articleRef}>
                  <Text maxWidth="65ch" color="gray.800">
                    {link.description}
                  </Text>
                </Box>
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
          </VStack>
        </Box>
      </Box>

      {/* Notebook column (lg and up): fixed to the right edge of the content
          column, under the toolbar, with its own scroll. */}
      {isWide && isNotebookOpen && (
        <Box
          position="fixed"
          top={headerHeight}
          bottom={0}
          left={columnLeft}
          width={columnWidth}
          pointerEvents="none"
          zIndex={3}
        >
          <Flex maxWidth="5xl" marginX="auto" height="100%" justify="flex-end">
            <Box
              as="aside"
              id="notebook-panel"
              aria-label="Notebook"
              width={NOTEBOOK_WIDTH}
              height="100%"
              pointerEvents="auto"
              backgroundColor="white"
              borderLeftWidth="thin"
              borderLeftColor="gray.100"
            >
              {notebook}
            </Box>
          </Flex>
        </Box>
      )}

      {/* Notebook drawer (below lg). */}
      {!isWide && (
        <Drawer
          isOpen={isDrawerOpen}
          placement="bottom"
          onClose={() => setIsDrawerOpen(false)}
          autoFocus={editingHighlightId === null}
          returnFocusOnClose={false}
        >
          <DrawerOverlay />
          <DrawerContent id="notebook-panel" height="75vh" borderTopRadius="xl">
            {notebook}
          </DrawerContent>
        </Drawer>
      )}

      <SelectionToolbar
        rect={selection ? selection.rect : null}
        isTouch={isTouch}
        isBusy={isCreating}
        onHighlight={() => handleCreateHighlight(false)}
        onHighlightWithNote={() => handleCreateHighlight(true)}
      />

      <HighlightPopover
        highlight={popoverHighlight}
        rect={popover ? popover.rect : null}
        onEdit={handleStartEditHighlight}
        onRemove={handleRemoveHighlight}
        onClose={closePopover}
      />
    </Box>
  );
}
