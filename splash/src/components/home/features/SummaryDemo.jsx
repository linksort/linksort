import React, { useEffect, useRef, useState, useCallback } from "react"
import { Box, Flex, Text, HStack, Button, Spinner } from "@chakra-ui/react"
import { useReducedMotion } from "framer-motion"

import { LINKS } from "./collection"
import { useTypewriter, useInView } from "../useDemoMotion"

/* ---------- AI summaries: the link view's Summary card, written in front of you ---------- */

// The same article the Reader tile shows, so the page keeps telling one story.
const ARTICLE = LINKS.find(l => l.id === "spotlight")

// Demonstration content in the shape the real prompt produces: the thesis
// first, then the points that matter, no two bullets opening the same way.
// Labeled "Example" in the card; this is not the model's output for the article.
const BULLETS = [
  "Chasing recognition is a poor path to happiness; those who want fame most enjoy life least.",
  "Studies tie status and admiration goals to more anxiety and weaker ties.",
  "Attention is a treadmill: each dose raises the bar for the next.",
  "Choosing obscurity, close friends and real work pays off more reliably.",
]
const TEXT = BULLETS.join("\n")

// How long the "Writing…" state holds before the bullets start.
const WRITING_MS = 1100

export function SummaryDemo() {
  const ref = useRef(null)
  const cardRef = useRef(null)
  const reduce = useReducedMotion()
  const [started, setStarted] = useInView(ref)
  const [typing, setTyping] = useState(false)
  const [run, setRun] = useState(0)

  // Hold the "Writing…" state for a beat, then type the bullets in.
  useEffect(() => {
    if (!started) {
      setTyping(false)
      return
    }
    if (reduce) {
      setTyping(true)
      return
    }
    const id = setTimeout(() => setTyping(true), WRITING_MS)
    return () => clearTimeout(id)
  }, [started, reduce, run])

  // Under reduced motion the card is rendered finished straight away, whether
  // or not it has scrolled into view.
  const finished = typing || Boolean(reduce)
  const [shown, done] = useTypewriter(TEXT, finished, 12)
  const lines = finished ? shown.split("\n").filter(Boolean) : []

  // On narrow tiles the card can run past the miniature's bottom edge; fade
  // it out the way the Reader tile fades its prose, but only when it does.
  const [clipped, setClipped] = useState(false)
  useEffect(() => {
    const check = () => {
      const d = ref.current
      const c = cardRef.current
      if (!d || !c) return
      setClipped(
        c.getBoundingClientRect().bottom > d.getBoundingClientRect().bottom - 1,
      )
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [shown])

  const replay = useCallback(() => {
    setTyping(false)
    setStarted(false)
    setRun(n => n + 1)
    // Restart on the next frame so the typewriter effect re-arms.
    requestAnimationFrame(() => setStarted(true))
  }, [setStarted])

  return (
    <Box
      ref={ref}
      h="100%"
      bg="white"
      px={5}
      pt={4}
      pb={4}
      overflow="hidden"
      position="relative"
    >
      <Flex align="center" gap={1.5} mb={1}>
        <Box
          w="3"
          h="3"
          bg={ARTICLE.favicon}
          borderRadius="sm"
          flexShrink={0}
        />
        <Text fontSize="xs" color="gray.600">
          {ARTICLE.site}
        </Text>
      </Flex>
      <Text
        fontSize="md"
        fontWeight="bold"
        color="gray.900"
        lineHeight="1.25"
        mb={3}
        noOfLines={1}
        title={ARTICLE.title}
      >
        {ARTICLE.title}
      </Text>

      {/* The app's Summary card: Paper, hairline, lg radius. */}
      <Box
        ref={cardRef}
        bg="gray.50"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        px={4}
        py={3}
        aria-live="polite"
      >
        <Flex align="center" justify="space-between" gap={2} mb={2}>
          <HStack spacing={2}>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.800"
              lineHeight="1.2"
            >
              Summary
            </Text>
            {started && !finished && (
              <HStack spacing={1.5} fontSize="2xs" color="gray.600">
                <Spinner
                  size="xs"
                  thickness="2px"
                  color="brand.500"
                  emptyColor="brand.100"
                />
                <Text as="span">Writing…</Text>
              </HStack>
            )}
          </HStack>
          <HStack spacing={2} fontSize="2xs" color="gray.500" flexShrink={0}>
            <Text as="span">Example</Text>
            <Button
              variant="link"
              colorScheme="brand"
              size="xs"
              fontSize="2xs"
              fontWeight="semibold"
              minW={0}
              h="auto"
              onClick={replay}
              aria-label="Replay the summary demo"
            >
              Replay
            </Button>
          </HStack>
        </Flex>

        {lines.length === 0 ? (
          <Text fontSize="xs" color="gray.600">
            The assistant is reading this link.
          </Text>
        ) : (
          <Box
            as="ul"
            listStyleType="none"
            m={0}
            p={0}
            fontSize="xs"
            lineHeight="1.5"
            color="gray.800"
          >
            {lines.map((line, i) => (
              <Box
                as="li"
                key={i}
                position="relative"
                pl="1.75em"
                mb={i === lines.length - 1 ? 0 : "0.5em"}
                _before={{
                  content: '""',
                  position: "absolute",
                  left: "0.25em",
                  top: "calc(0.875em - 0.1875em)",
                  w: "0.375em",
                  h: "0.375em",
                  borderRadius: "full",
                  bg: "gray.800",
                }}
              >
                {line}
                {!done && i === lines.length - 1 && (
                  <Box
                    as="span"
                    display="inline-block"
                    w="2px"
                    h="1em"
                    bg="brand.500"
                    ml="1px"
                    verticalAlign="text-bottom"
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
      {clipped && (
        <Box
          position="absolute"
          left={0}
          right={0}
          bottom={0}
          h="10"
          bgGradient="linear(to-t, white, transparent)"
          pointerEvents="none"
        />
      )}
    </Box>
  )
}
