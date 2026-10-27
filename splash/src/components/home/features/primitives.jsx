import React from "react"
import { Box, Flex, Text, HStack } from "@chakra-ui/react"

// Tiny icon set drawn in one stroke weight, matching the app's icon sizes.
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }

export const Icon = {
  Search: (p) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <circle cx="11" cy="11" r="7" {...stroke} />
      <path d="M21 21l-4.3-4.3" {...stroke} />
    </Box>
  ),
  Sort: (p) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <path d="M8 4l-4 4M8 4l4 4M8 4v16M16 20l4-4M16 20l-4-4M16 20V4" {...stroke} />
    </Box>
  ),
  Group: (p) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <rect x="4" y="8" width="12" height="12" rx="2" {...stroke} />
      <path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" {...stroke} />
    </Box>
  ),
  Star: ({ filled, ...p }) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <path
        d="M12 3l2.7 6 6.3.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.2 1.4-6.3L3 9.6l6.3-.6z"
        {...stroke}
        fill={filled ? "currentColor" : "none"}
      />
    </Box>
  ),
  Tag: (p) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <path d="M3 12V4h8l10 10-8 8z" {...stroke} />
      <circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </Box>
  ),
  Folder: (p) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z" fill="currentColor" stroke="none" />
    </Box>
  ),
  Lines: (p) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" {...stroke} />
    </Box>
  ),
  Plus: (p) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <path d="M12 5v14M5 12h14" {...stroke} />
    </Box>
  ),
  Eye: (p) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" {...stroke} />
      <circle cx="12" cy="12" r="3" {...stroke} />
    </Box>
  ),
  Dots: (p) => (
    <Box as="svg" viewBox="0 0 24 24" w="3.5" h="3.5" {...p}>
      <circle cx="12" cy="5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" />
    </Box>
  ),
}

// A sidebar-style row: ghost button, left icon, 0.9rem text.
export function SideRow({ icon, children, active, muted, onClick, ...rest }) {
  return (
    <Flex
      as={onClick ? "button" : "div"}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      align="center"
      gap={2}
      w="100%"
      h="7"
      px={2}
      ml={-2}
      borderRadius="lg"
      fontSize="0.9rem"
      letterSpacing="0.01rem"
      color="gray.800"
      bg={active ? "gray.100" : "transparent"}
      textAlign="left"
      transition="background-color 0.2s ease"
      _hover={onClick ? { bg: "gray.100" } : undefined}
      _focusVisible={{ boxShadow: "outline", outline: "none" }}
      {...rest}
    >
      <Box color="gray.800" flexShrink={0}>
        {icon}
      </Box>
      <Text as="span" noOfLines={1}>
        {children}
        {muted && (
          <Text as="span" color="gray.500">
            {" "}
            {muted}
          </Text>
        )}
      </Text>
    </Flex>
  )
}

// A condensed-view link row: favicon dot, title, kebab.
export function CondensedRow({ link, dim }) {
  return (
    <Flex
      align="center"
      gap={2}
      h="8"
      px={2}
      borderBottom="1px solid"
      borderBottomColor="gray.100"
      bg="white"
      fontSize="xs"
      opacity={dim ? 0.35 : 1}
      transition="opacity 0.2s ease"
    >
      <Box w="3.5" h="3.5" borderRadius="sm" bg={link.favicon} flexShrink={0} />
      <Text noOfLines={1} flex="1" color="gray.800">
        {link.title}
      </Text>
      <Icon.Dots color="gray.500" />
    </Flex>
  )
}

export function Chip({ children, ...rest }) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      h="6"
      px="2"
      bg="gray.100"
      borderRadius="md"
      fontSize="2xs"
      fontWeight="semibold"
      color="gray.800"
      {...rest}
    >
      {children}
    </Box>
  )
}

export function ControlRow({ link, size = "6" }) {
  return (
    <HStack spacing={1.5}>
      {[<Icon.Folder />, <Icon.Star filled={link.favorite} />, <Icon.Eye />, <Icon.Dots />].map((ic, i) => (
        <Flex key={i} w={size} h={size} align="center" justify="center" bg="gray.100" borderRadius="md" color="gray.800">
          {ic}
        </Flex>
      ))}
    </HStack>
  )
}
