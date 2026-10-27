import React, { useEffect, useRef, useState, useCallback } from "react"
import {
  Box,
  Flex,
  Text,
  Heading,
  Container,
  Button,
  Stack,
  HStack,
} from "@chakra-ui/react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

const MotionBox = motion(Box)
const EASE = [0.16, 1, 0.3, 1]

// A scripted, in-page rendition of the assistant's "welcome back" review.
// Everything here is demonstration data; the panel says so.
const INTRO =
  "Welcome back, Alex 👋 You saved 4 links since yesterday. Two look like recipes (NYT Cooking and The New Yorker's vegan pho piece) and two are long reads from The Atlantic. Want me to file the recipes under Restaurants To Try and the rest under Long Reads?"

const CHOICES = ["Yes, file them", "Just the recipes", "Not now"]

const LINKS = {
  recipes: [
    "Paneer Ajwaini Tikka (Fresh Roasted Paneer)",
    "The Scent of Spices, and Vegan Pho, at Pho Nam",
  ],
  reads: [
    "To Be Happy, Hide From the Spotlight",
    "The Seven Habits That Lead to Happiness in Old Age",
  ],
}

function planFor(choice) {
  if (choice === "Not now") {
    return {
      tools: [],
      reply:
        "No problem. They'll stay in All, and I'll ask again another day. Nothing moves unless you say so.",
    }
  }
  const tools = LINKS.recipes.map((t) => ({
    name: "add_link_to_folder",
    detail: `${t} → Restaurants To Try`,
  }))
  if (choice === "Yes, file them") {
    LINKS.reads.forEach((t) =>
      tools.push({ name: "add_link_to_folder", detail: `${t} → Long Reads` })
    )
    return {
      tools,
      reply:
        "Done. Two recipes are in Restaurants To Try and two articles are in Long Reads. Your All view is tidy again.",
    }
  }
  return {
    tools,
    reply:
      "Done. Both recipes are in Restaurants To Try; I left the two articles where they were.",
  }
}

function useTypewriter(text, active, speed = 14) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? text : "")
  const [done, setDone] = useState(Boolean(reduce))
  useEffect(() => {
    if (!active) return
    if (reduce) {
      setShown(text)
      setDone(true)
      return
    }
    let i = 0
    setShown("")
    setDone(false)
    const id = setInterval(() => {
      i += 3
      setShown(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, active, reduce, speed])
  return [shown, done]
}

function Bubble({ from, children, ...rest }) {
  const user = from === "user"
  return (
    <Box
      alignSelf={user ? "flex-end" : "flex-start"}
      maxW="90%"
      bg={user ? "brand.500" : "gray.50"}
      color={user ? "white" : "gray.800"}
      border="1px solid"
      borderColor={user ? "brand.500" : "gray.200"}
      borderRadius="lg"
      px={4}
      py={3}
      fontSize="sm"
      lineHeight="1.55"
      {...rest}
    >
      {children}
    </Box>
  )
}

function StatusDot({ state }) {
  const color =
    state === "done" ? "green.600" : state === "running" ? "brand.500" : "gray.400"
  return (
    <Box
      as="span"
      display="inline-block"
      w="2"
      h="2"
      borderRadius="full"
      bg={color}
      flexShrink={0}
      transition="background-color 0.2s ease"
    />
  )
}

function ToolRow({ tool, state }) {
  return (
    <HStack spacing={2} fontSize="xs" color="gray.700" align="flex-start">
      <Box pt="5px">
        <StatusDot state={state} />
      </Box>
      <Text as="span" fontWeight="semibold" fontFamily="mono" flexShrink={0}>
        {tool.name}
      </Text>
      <Text as="span" color="gray.600" noOfLines={1}>
        {tool.detail}
      </Text>
    </HStack>
  )
}

export default function AssistantDemo() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const [started, setStarted] = useState(false)
  const [choice, setChoice] = useState(null)
  const [toolStates, setToolStates] = useState([])
  const [replyOn, setReplyOn] = useState(false)
  const [run, setRun] = useState(0)

  const [intro, introDone] = useTypewriter(INTRO, started)
  const plan = choice ? planFor(choice) : null
  const [reply, replyDone] = useTypewriter(plan ? plan.reply : "", replyOn)

  // Start when the panel scrolls into view.
  useEffect(() => {
    if (started || typeof IntersectionObserver === "undefined") return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [started])

  // Walk the tool calls one by one after a choice.
  useEffect(() => {
    if (!plan) return
    if (plan.tools.length === 0) {
      setReplyOn(true)
      return
    }
    const step = reduce ? 0 : 420
    let i = 0
    setToolStates(plan.tools.map(() => "pending"))
    const timers = []
    plan.tools.forEach((_, idx) => {
      timers.push(
        setTimeout(() => {
          setToolStates((s) => s.map((v, j) => (j === idx ? "running" : v)))
        }, step * idx + 120)
      )
      timers.push(
        setTimeout(() => {
          setToolStates((s) => s.map((v, j) => (j === idx ? "done" : v)))
          i += 1
          if (i === plan.tools.length) setReplyOn(true)
        }, step * (idx + 1))
      )
    })
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, run])

  const replay = useCallback(() => {
    setChoice(null)
    setToolStates([])
    setReplyOn(false)
    setStarted(false)
    setRun((n) => n + 1)
    // Restart on the next frame so the typewriter effect re-arms.
    requestAnimationFrame(() => setStarted(true))
  }, [])

  const fade = {
    initial: reduce ? false : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: EASE },
  }

  return (
    <Box as="section" id="assistant" position="relative" zIndex={1}>
      <Container maxWidth="7xl" px={6} py={{ base: 16, md: 24 }}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          gap={{ base: 10, lg: 16 }}
          align="center"
        >
          <Box flex="1" maxW="34rem">
            <Heading
              as="h2"
              fontSize={{ base: "2xl", md: "4xl" }}
              letterSpacing="-0.02em"
              color="gray.900"
              mb={4}
            >
              Come back to a tidy box.
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="gray.700" mb={4}>
              When you return, the assistant looks at what you saved since last
              time, notices what belongs together, and offers to file it. It
              never moves a link until you say yes.
            </Text>
            <Text fontSize={{ base: "md", md: "lg" }} color="gray.700" mb={6}>
              Ask it anything else, too: summarize a long read, compare two
              articles, find that recipe from last month, or clean up a folder.
            </Text>
            <Button
              variant="link"
              colorScheme="brand"
              onClick={replay}
              fontWeight="semibold"
              size="sm"
            >
              Replay the demo
            </Button>
          </Box>

          <Box
            ref={ref}
            flex="1"
            w="100%"
            maxW="30rem"
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
          >
            <Flex
              align="center"
              justify="space-between"
              h="12"
              px={4}
              borderBottom="1px solid"
              borderBottomColor="gray.100"
            >
              <Text fontWeight="bold" color="gray.900">
                Chat
              </Text>
              <Text fontSize="xs" color="gray.500">
                Scripted demo
              </Text>
            </Flex>

            <Stack spacing={3} p={4} minH={{ base: "22rem", md: "26rem" }}>
              <Bubble from="assistant" minH="4.5rem">
                {intro}
                {!introDone && started && (
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
              </Bubble>

              <AnimatePresence initial={false}>
                {introDone && !choice && (
                  <MotionBox key="choices" {...fade}>
                    <Flex wrap="wrap" gap={2}>
                      {CHOICES.map((c) => (
                        <Button
                          key={c}
                          size="sm"
                          variant="outline"
                          colorScheme="brand"
                          onClick={() => setChoice(c)}
                          height="auto"
                          minH="8"
                          py="1.5"
                          whiteSpace="normal"
                          textAlign="left"
                        >
                          {c}
                        </Button>
                      ))}
                    </Flex>
                  </MotionBox>
                )}

                {choice && (
                  <MotionBox key="user" {...fade} display="flex">
                    <Bubble from="user">{choice}</Bubble>
                  </MotionBox>
                )}

                {choice && plan.tools.length > 0 && (
                  <MotionBox key="tools" {...fade}>
                    <Stack
                      spacing={2}
                      bg="gray.50"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      px={3}
                      py={2}
                    >
                      {plan.tools.map((t, i) => (
                        <ToolRow key={i} tool={t} state={toolStates[i]} />
                      ))}
                    </Stack>
                  </MotionBox>
                )}

                {replyOn && (
                  <MotionBox key="reply" {...fade} display="flex">
                    <Bubble from="assistant">{reply}</Bubble>
                  </MotionBox>
                )}
              </AnimatePresence>
            </Stack>

            <Flex
              p={3}
              borderTop="1px solid"
              borderTopColor="gray.100"
              gap={2}
              align="center"
            >
              <Box
                flex="1"
                h="9"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                px={3}
                display="flex"
                alignItems="center"
                fontSize="sm"
                color="gray.500"
              >
                {replyDone ? "Ask me anything about your links…" : "Type your message…"}
              </Box>
              <Box
                w="9"
                h="9"
                bg="brand.500"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                aria-hidden="true"
              >
                <Box as="svg" viewBox="0 0 24 24" w="4" h="4" fill="none">
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Box>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
