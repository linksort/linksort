import React, { useState } from "react"
import GatsbyImage from "gatsby-image"
import { Box, Flex, Text, Heading, Container, HStack } from "@chakra-ui/react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

import chromeIcon from "../../../content/assets/ways/chrome.png"
import firefoxIcon from "../../../content/assets/ways/firefox.png"
import safariIcon from "../../../content/assets/ways/safari.png"
import braveIcon from "../../../content/assets/ways/brave.png"

const MotionBox = motion(Box)

const EASE = [0.16, 1, 0.3, 1]

const SEGMENTS = [
  { id: "web", label: "Web" },
  { id: "iphone", label: "iPhone" },
  { id: "ipad", label: "iPad" },
  { id: "ext", label: "Extensions" },
]

const CAPTIONS = {
  web: "The web app at linksort.com. Three views, folders, auto tags, graph, and the AI assistant.",
  iphone: "Linksort for iPhone. The same collection, a share extension for any app, and Safari saving.",
  ipad: "Linksort for iPad. A real sidebar, the full grid, and graph view at tablet size.",
  ext: "Chrome, Firefox, Safari, Brave, and the iOS share sheet. One click, and you're back to browsing.",
}

function Segmented({ value, onChange }) {
  return (
    <HStack
      role="tablist"
      aria-label="Choose a device"
      spacing={0}
      display="inline-flex"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
    >
      {SEGMENTS.map((s) => {
        const on = s.id === value
        return (
          <Box
            key={s.id}
            as="button"
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(s.id)}
            px={{ base: 3, md: 5 }}
            h="10"
            fontSize={{ base: "sm", md: "md" }}
            fontWeight="semibold"
            color={on ? "white" : "gray.800"}
            bg={on ? "brand.500" : "transparent"}
            transition="background-color 0.2s ease, color 0.2s ease"
            _hover={{ bg: on ? "brand.600" : "gray.100" }}
            _focusVisible={{ boxShadow: "outline", zIndex: 1 }}
            position="relative"
          >
            {s.label}
          </Box>
        )
      })}
    </HStack>
  )
}

function Laptop({ image, ...rest }) {
  return (
    <Box {...rest}>
      <Box
        bg="gray.900"
        borderRadius="xl"
        p="1.5%"
        pb="2.2%"
        borderBottomRadius="md"
      >
        <Box borderRadius="md" overflow="hidden" bg="white">
          <GatsbyImage fluid={image} />
        </Box>
      </Box>
      <Box
        h="10px"
        mx="-3%"
        bg="gray.300"
        borderBottomRadius="lg"
        borderTop="1px solid"
        borderTopColor="gray.400"
      />
    </Box>
  )
}

function Phone({ image, ...rest }) {
  return (
    <Box
      bg="gray.900"
      borderRadius="2.75rem"
      p="2.5%"
      boxShadow="inset 0 0 0 2px rgba(255,255,255,0.06)"
      {...rest}
    >
      <Box borderRadius="2.25rem" overflow="hidden" bg="white">
        <GatsbyImage fluid={image} />
      </Box>
    </Box>
  )
}

function Tablet({ image, ...rest }) {
  return (
    <Box bg="gray.900" borderRadius="1.75rem" p="2.4%" {...rest}>
      <Box borderRadius="1.25rem" overflow="hidden" bg="white">
        <GatsbyImage fluid={image} />
      </Box>
    </Box>
  )
}

const WAYS = [
  { icon: chromeIcon, name: "Chrome" },
  { icon: firefoxIcon, name: "Firefox" },
  { icon: safariIcon, name: "Safari" },
  { icon: braveIcon, name: "Brave" },
]

function ShareSheetGlyph(props) {
  return (
    <Box as="svg" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 15V4m0 0L8 8m4-4 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Box>
  )
}

function ExtensionsPanel({ image }) {
  return (
    <Box
      bg="white"
      borderRadius="3xl"
      boxShadow="rgba(0, 0, 0, 0.12) 0px 12px 40px -8px"
      p={{ base: 6, md: 8 }}
      w="100%"
      maxW="34rem"
      mx="auto"
    >
      <Flex gap={6} align="center" direction={{ base: "column", sm: "row" }}>
        <Box w="9rem" flexShrink={0}>
          <GatsbyImage fluid={image} />
        </Box>
        <Box flex="1">
          <Text fontWeight="semibold" color="gray.900" mb={3}>
            Save to Linksort
          </Text>
          <Flex wrap="wrap" gap={3}>
            {WAYS.map((w) => (
              <Flex
                key={w.name}
                align="center"
                gap={2}
                bg="gray.100"
                borderRadius="lg"
                px={3}
                h="9"
                fontSize="sm"
                fontWeight="semibold"
              >
                <Box as="img" src={w.icon} alt="" w="5" h="5" />
                {w.name}
              </Flex>
            ))}
            <Flex
              align="center"
              gap={2}
              bg="gray.100"
              borderRadius="lg"
              px={3}
              h="9"
              fontSize="sm"
              fontWeight="semibold"
            >
              <ShareSheetGlyph w="5" h="5" color="gray.800" />
              iOS Share Sheet
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}

const DEVICE_LAYOUT = {
  // Resting positions on the desktop stage, in % of the stage width.
  ipad: { left: "4%", top: "20%", width: "30%" },
  web: { left: "22%", top: "6%", width: "56%" },
  iphone: { left: "73%", top: "10%", width: "19%" },
}

export default function DeviceStage({ images }) {
  const [active, setActive] = useState("web")
  const reduce = useReducedMotion()

  const front = (id) => active === id
  const z = (id) => (front(id) ? 3 : id === "web" ? 2 : 1)

  const deviceAnim = (id) => ({
    scale: front(id) ? 1.04 : active === "ext" ? 0.97 : 1,
    opacity: active === "ext" ? 0.55 : 1,
    filter: front(id) || active === "ext" ? "none" : "saturate(0.92)",
  })

  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.6, ease: EASE }

  return (
    <Box
      as="section"
      id="everywhere"
      bg="gray.50"
      borderTop="1px solid"
      borderTopColor="gray.100"
      borderBottom="1px solid"
      borderBottomColor="gray.100"
      position="relative"
      zIndex={1}
    >
      <Container maxWidth="7xl" px={6} pt={{ base: 14, md: 20 }} pb={{ base: 10, md: 14 }}>
        <Box textAlign="center" maxW="46rem" mx="auto">
          <Heading
            as="h2"
            fontSize={{ base: "2xl", md: "4xl" }}
            letterSpacing="-0.02em"
            color="gray.900"
            mb={3}
          >
            Your links, on every screen you own.
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color="gray.700" mb={6}>
            The same collection in your browser, on your iPhone, and on your
            iPad. Save from anywhere. Find it anywhere.
          </Text>
          <Segmented value={active} onChange={setActive} />
          <Box minH="3.5rem" mt={4} px={2}>
            <AnimatePresence mode="wait" initial={false}>
              <MotionBox
                key={active}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 1 } : { opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: EASE }}
                fontSize="sm"
                color="gray.600"
                aria-live="polite"
              >
                {CAPTIONS[active]}
              </MotionBox>
            </AnimatePresence>
          </Box>
        </Box>

        {/* Desktop stage: all three devices, the active one steps forward. */}
        <Box
          display={{ base: "none", md: "block" }}
          position="relative"
          h={{ md: "30rem", lg: "36rem" }}
          mt={2}
        >
          <MotionBox
            position="absolute"
            style={{ zIndex: z("ipad") }}
            animate={deviceAnim("ipad")}
            transition={transition}
            {...DEVICE_LAYOUT.ipad}
            cursor="pointer"
            onClick={() => setActive("ipad")}
          >
            <Tablet image={images.ipad} />
          </MotionBox>
          <MotionBox
            position="absolute"
            style={{ zIndex: z("web") }}
            animate={deviceAnim("web")}
            transition={transition}
            {...DEVICE_LAYOUT.web}
            cursor="pointer"
            onClick={() => setActive("web")}
          >
            <Laptop image={images.web} />
          </MotionBox>
          <MotionBox
            position="absolute"
            style={{ zIndex: z("iphone") }}
            animate={deviceAnim("iphone")}
            transition={transition}
            {...DEVICE_LAYOUT.iphone}
            cursor="pointer"
            onClick={() => setActive("iphone")}
          >
            <Phone image={images.iphone} />
          </MotionBox>

          <AnimatePresence>
            {active === "ext" && (
              <MotionBox
                key="ext"
                position="absolute"
                left="0"
                right="0"
                top="28%"
                style={{ zIndex: 4 }}
                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.4, ease: EASE }}
                px={6}
              >
                <ExtensionsPanel image={images.extension} />
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>

        {/* Mobile stage: one device at a time. */}
        <Box display={{ base: "block", md: "none" }} mt={4} minH="22rem">
          <AnimatePresence mode="wait" initial={false}>
            <MotionBox
              key={active}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: EASE }}
              mx="auto"
              w={
                active === "iphone" ? "60%" : active === "ipad" ? "85%" : "100%"
              }
            >
              {active === "web" && <Laptop image={images.web} />}
              {active === "iphone" && <Phone image={images.iphone} />}
              {active === "ipad" && <Tablet image={images.ipad} />}
              {active === "ext" && <ExtensionsPanel image={images.extension} />}
            </MotionBox>
          </AnimatePresence>
        </Box>

        {/* Always visible: the capture paths. */}
        <Flex
          mt={{ base: 8, md: 6 }}
          justify="center"
          align="center"
          wrap="wrap"
          gap={3}
          rowGap={3}
        >
          {WAYS.map((w) => (
            <Flex
              key={w.name}
              align="center"
              gap={2}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              px={3}
              h="9"
              fontSize="sm"
              fontWeight="semibold"
              color="gray.800"
            >
              <Box as="img" src={w.icon} alt="" w="5" h="5" />
              {w.name}
            </Flex>
          ))}
          <Flex
            align="center"
            gap={2}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            px={3}
            h="9"
            fontSize="sm"
            fontWeight="semibold"
            color="gray.800"
          >
            <ShareSheetGlyph w="5" h="5" color="gray.800" />
            iOS Share Sheet
          </Flex>
          <Flex
            align="center"
            gap={2}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            px={3}
            h="9"
            fontSize="sm"
            fontWeight="semibold"
            color="gray.800"
          >
            <Box as="img" src={safariIcon} alt="" w="5" h="5" />
            Safari on iPhone
          </Flex>
          <Text
            fontSize="sm"
            color="gray.600"
            w={{ base: "100%", md: "auto" }}
            textAlign="center"
            pl={{ md: 2 }}
          >
            Six ways in. One box.
          </Text>
        </Flex>
      </Container>
    </Box>
  )
}
