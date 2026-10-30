import React from "react"
import { Box, Flex, Text, Heading, Container, Grid, GridItem, HStack } from "@chakra-ui/react"

import GraphDemo from "./features/GraphDemo"
import { AutoTagsDemo, SearchDemo, ViewsDemo, FoldersDemo, ReaderDemo, NotesDemo } from "./features/SmallDemos"
import { SummaryDemo } from "./features/SummaryDemo"

function Chip({ children }) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      h="7"
      px="2.5"
      bg="gray.100"
      borderRadius="lg"
      fontSize="xs"
      fontWeight="semibold"
      color="gray.800"
    >
      {children}
    </Box>
  )
}

/**
 * A feature rendered the way Linksort renders a link: a live miniature of
 * the feature where the cover goes, a hairline, title and one line, then a
 * row of chips where the controls go. `colSpan` is a number (applied from
 * `md` up) or a responsive object such as `{ md: 2, lg: 1 }`.
 */
function FeatureTile({ demo, demoHeight = "15rem", title, text, chips = [], colSpan = 1 }) {
  return (
    <GridItem
      colSpan={typeof colSpan === "object" ? { base: 1, ...colSpan } : { base: 1, md: colSpan }}
      as="article"
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="xl"
      boxShadow="sm"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      <Box h={demoHeight} flexShrink={0} overflow="hidden" borderBottom="1px solid" borderBottomColor="gray.100">
        {demo}
      </Box>
      <Flex direction="column" justify="space-between" pt={3} px={4} pb={4} gap={3} flex="1">
        <Box>
          <Text fontWeight="semibold" color="gray.900">
            {title}
          </Text>
          <Text fontSize="sm" color="gray.700" mt={1}>
            {text}
          </Text>
        </Box>
        {chips.length > 0 && (
          <HStack spacing={2} wrap="wrap">
            {chips.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </HStack>
        )}
      </Flex>
    </GridItem>
  )
}

export default function FeatureBox() {
  return (
    <Box as="section" id="features" position="relative" zIndex={1}>
      <Container maxWidth="7xl" px={6} py={{ base: 16, md: 24 }}>
        <Box maxW="40rem" mb={{ base: 8, md: 10 }}>
          <Heading as="h2" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="-0.02em" color="gray.900" mb={3}>
            All the features you expect. And more.
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
            All of the tools you'd expect to help you find things easily and keep things tidy.
          </Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
          <FeatureTile
            demo={<GraphDemo />}
            demoHeight={{ base: "16rem", md: "20rem" }}
            colSpan={2}
            title="Graph view"
            text="Explore relationships among your links and their topics with network graph view."
            chips={["Web", "iPhone", "iPad"]}
          />
          <FeatureTile
            demo={<AutoTagsDemo />}
            demoHeight={{ base: "16rem", md: "20rem" }}
            title="Auto tags"
            text="We magically* organize your links into categories for you—okay, we don't have magic, just the next best thing, machine learning."
            chips={["Automatic"]}
          />
          <FeatureTile
            demo={<SearchDemo />}
            title="Search, sort, group, favorite"
            text="Full-text search over your links. Sort by date, group by day, star the keepers."
            chips={["Web", "iOS"]}
          />
          <FeatureTile
            demo={<ViewsDemo />}
            title="Three views"
            text="Linksort has three ways of displaying your links: tiled view, comfy, or condensed. Whatever you choose, your links will look great."
            chips={["Tiled", "Comfy", "Condensed"]}
          />
          <FeatureTile
            demo={<FoldersDemo />}
            title="Folders"
            text="Sometimes you just need a good old folder. Make them yourself, or let the assistant propose them."
            chips={["Manual", "Assistant"]}
          />
          {/* Row three at lg: open an article, read it, get the summary, jot a note. */}
          <FeatureTile
            demo={<ReaderDemo />}
            colSpan={{ md: 2, lg: 1 }}
            demoHeight={{ base: "15rem", md: "17rem", lg: "20rem" }}
            title="Reader view"
            text="Articles saved as clean, readable text."
            chips={["Web", "iOS"]}
          />
          <FeatureTile
            demo={<SummaryDemo />}
            demoHeight="20rem"
            title="AI summaries"
            text="Open a saved article and a short summary is generated."
            chips={["Web", "iOS", "Automatic"]}
          />
          <FeatureTile
            demo={<NotesDemo />}
            demoHeight={{ base: "15rem", md: "20rem" }}
            title="Notes & highlights"
            text="Highlight text from your links and jot down your thoughts as you read."
            chips={["Web", "iOS"]}
          />
        </Grid>
      </Container>
    </Box>
  )
}
