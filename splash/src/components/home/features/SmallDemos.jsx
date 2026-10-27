import React, { useState, useEffect, useRef } from "react"
import { Box, Flex, Text, Stack, HStack, Input, Textarea } from "@chakra-ui/react"

import { LINKS, TAGS, FOLDERS } from "./collection"
import { Icon, SideRow, CondensedRow, Chip, ControlRow } from "./primitives"

/* ---------- Auto tags: click a tag, the matching links light up ---------- */
export function AutoTagsDemo() {
  const [tag, setTag] = useState("Food & Drink")
  const shown = TAGS.slice(0, 7)
  return (
    <Flex h="100%" bg="white">
      <Box w="52%" bg="gray.50" borderRight="1px solid" borderRightColor="gray.100" py={3} pl={4} pr={3}>
        <Text fontSize="2xs" fontWeight="semibold" letterSpacing="0.05em" color="gray.600" mb={2}>
          AUTO TAGS
        </Text>
        <Stack spacing={0.5}>
          {shown.map((t) => (
            <SideRow key={t} icon={<Icon.Tag />} active={t === tag} onClick={() => setTag(t)}>
              {t}
            </SideRow>
          ))}
        </Stack>
      </Box>
      <Box flex="1" overflow="hidden">
        {LINKS.map((l) => (
          <CondensedRow key={l.id} link={l} dim={l.tag !== tag} />
        ))}
      </Box>
    </Flex>
  )
}

/* ---------- Search, sort, group, favorite: real filtering ---------- */
export function SearchDemo() {
  const [q, setQ] = useState("")
  const [newest, setNewest] = useState(true)
  const [fav, setFav] = useState(false)
  let list = LINKS.filter((l) => !fav || l.favorite)
  if (q) {
    const s = q.toLowerCase()
    list = list.filter((l) => l.title.toLowerCase().includes(s) || l.site.toLowerCase().includes(s))
  }
  if (!newest) list = [...list].reverse()
  return (
    <Flex h="100%" bg="white">
      <Box w="52%" bg="gray.50" borderRight="1px solid" borderRightColor="gray.100" py={3} pl={4} pr={3}>
        <Flex align="center" gap={2} h="7" ml={-2} px={2} mb={1} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg">
          <Icon.Search color="gray.600" />
          <Input
            variant="unstyled"
            size="xs"
            fontSize="0.85rem"
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search the demo collection"
          />
        </Flex>
        <Stack spacing={0.5}>
          <SideRow icon={<Icon.Sort />} muted={newest ? "newest first" : "oldest first"} onClick={() => setNewest((v) => !v)}>
            Sort by
          </SideRow>
          <SideRow icon={<Icon.Group />} muted="none">
            Group by
          </SideRow>
          <SideRow icon={<Icon.Star filled={fav} />} active={fav} onClick={() => setFav((v) => !v)}>
            Favorites
          </SideRow>
        </Stack>
      </Box>
      <Box flex="1" overflow="hidden">
        {list.length === 0 ? (
          <Text fontSize="xs" color="gray.500" p={4}>
            Nothing matches "{q}".
          </Text>
        ) : (
          list.map((l) => <CondensedRow key={l.id} link={l} />)
        )}
      </Box>
    </Flex>
  )
}

/* ---------- Three views: one segmented control, three renderings ---------- */
const VIEWS = ["Tiled", "Comfy", "Condensed"]

export function ViewsDemo() {
  const [view, setView] = useState("Tiled")
  const three = LINKS.slice(0, 3)
  return (
    <Flex direction="column" h="100%" bg="gray.50">
      <Flex p={2} justify="center">
        <HStack spacing={0} border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden" bg="white">
          {VIEWS.map((v) => (
            <Box
              key={v}
              as="button"
              type="button"
              px={2.5}
              h="6"
              fontSize="2xs"
              fontWeight="semibold"
              bg={v === view ? "brand.500" : "transparent"}
              color={v === view ? "white" : "gray.800"}
              onClick={() => setView(v)}
              transition="background-color 0.2s ease"
              _focusVisible={{ boxShadow: "outline", outline: "none" }}
            >
              {v}
            </Box>
          ))}
        </HStack>
      </Flex>
      <Box flex="1" px={3} pb={3} overflow="hidden">
        {view === "Tiled" && (
          <Flex gap={2} h="100%">
            {three.map((l) => (
              <Flex key={l.id} direction="column" flex="1" bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" overflow="hidden" minW={0}>
                <Box h="45%" bg={l.cover} />
                <Box p={2} borderTop="1px solid" borderTopColor="gray.100" flex="1" minW={0}>
                  <Text fontSize="2xs" fontWeight="semibold" noOfLines={1}>
                    {l.title}
                  </Text>
                  <Text fontSize="2xs" color="gray.600" noOfLines={1}>
                    {l.site}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Flex>
        )}
        {view === "Comfy" && (
          <Stack spacing={2}>
            {three.map((l) => (
              <Flex key={l.id} gap={2} bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={1.5} align="center">
                <Box w="12" h="9" borderRadius="sm" bg={l.cover} flexShrink={0} />
                <Box minW={0} flex="1">
                  <Text fontSize="2xs" fontWeight="semibold" noOfLines={1}>
                    {l.title}
                  </Text>
                  <Text fontSize="2xs" color="gray.600">
                    {l.site}
                  </Text>
                </Box>
                <ControlRow link={l} size="5" />
              </Flex>
            ))}
          </Stack>
        )}
        {view === "Condensed" && (
          <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" overflow="hidden">
            {LINKS.slice(0, 6).map((l) => (
              <CondensedRow key={l.id} link={l} />
            ))}
          </Box>
        )}
      </Box>
    </Flex>
  )
}

/* ---------- Folders: a tree you can select and add to ---------- */
export function FoldersDemo() {
  const [folders, setFolders] = useState(FOLDERS)
  const [sel, setSel] = useState("All")
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const count = (f) => (f === "All" ? LINKS.length : LINKS.filter((l) => l.folder === f).length)
  const commit = () => {
    const n = name.trim()
    if (n) setFolders((fs) => [...fs, n])
    setName("")
    setAdding(false)
    if (n) setSel(n)
  }
  return (
    <Flex h="100%" bg="white">
      <Box w="60%" bg="gray.50" borderRight="1px solid" borderRightColor="gray.100" py={3} pl={4} pr={3}>
        <Text fontSize="2xs" fontWeight="semibold" letterSpacing="0.05em" color="gray.600" mb={2}>
          FOLDERS
        </Text>
        <Stack spacing={0.5}>
          <SideRow icon={<Icon.Lines />} active={sel === "All"} onClick={() => setSel("All")}>
            All
          </SideRow>
          {folders.map((f) => (
            <SideRow key={f} icon={<Icon.Folder />} active={sel === f} onClick={() => setSel(f)}>
              {f}
            </SideRow>
          ))}
          {adding ? (
            <Flex align="center" gap={2} h="7" ml={-2} px={2}>
              <Icon.Folder color="gray.800" />
              <Input
                autoFocus
                variant="unstyled"
                size="xs"
                fontSize="0.9rem"
                placeholder="Folder name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => e.key === "Enter" && commit()}
                aria-label="New folder name"
              />
            </Flex>
          ) : (
            <SideRow icon={<Icon.Plus />} onClick={() => setAdding(true)}>
              New folder
            </SideRow>
          )}
        </Stack>
      </Box>
      <Box flex="1" p={3}>
        <Text fontSize="sm" fontWeight="bold" color="gray.900" noOfLines={1}>
          {sel}
        </Text>
        <Text fontSize="2xs" color="gray.600" mb={2}>
          {count(sel)} {count(sel) === 1 ? "link" : "links"}
        </Text>
        <Stack spacing={1}>
          {LINKS.filter((l) => sel === "All" || l.folder === sel)
            .slice(0, 4)
            .map((l) => (
              <Flex key={l.id} gap={1.5} align="center">
                <Box w="6" h="4" borderRadius="sm" bg={l.cover} flexShrink={0} />
                <Text fontSize="2xs" noOfLines={1}>
                  {l.title}
                </Text>
              </Flex>
            ))}
          {count(sel) === 0 && (
            <Text fontSize="2xs" color="gray.500">
              Empty. Drag links here, or ask the assistant.
            </Text>
          )}
        </Stack>
      </Box>
    </Flex>
  )
}

/* ---------- Reader view: real prose, selectable ---------- */
export function ReaderDemo() {
  return (
    <Box h="100%" bg="white" px={{ base: 5, md: 8 }} pt={5} overflow="hidden" position="relative">
      <HStack spacing={1.5} mb={3}>
        {["Favorite", "Edit", "Visit"].map((b) => (
          <Chip key={b} h="7" px="2.5" fontSize="xs">
            {b}
          </Chip>
        ))}
      </HStack>
      <Flex align="center" gap={1.5} mb={1}>
        <Box w="3" h="3" bg="#c0392b" borderRadius="sm" />
        <Text fontSize="xs" color="gray.600">
          The Atlantic
        </Text>
      </Flex>
      <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="gray.900" lineHeight="1.25" mb={3}>
        To Be Happy, Hide From the Spotlight
      </Text>
      <Text fontFamily="serif" fontSize={{ base: "sm", md: "md" }} lineHeight="1.6" color="gray.800">
        Fame is a strange ambition. Almost everyone wants a little of it, almost no one who has a lot of it says
        it made them happier, and yet the pull never quite goes away. The research on this is unusually clear:
        people who organize their lives around recognition report lower well-being than people who organize them
        around relationships and work they find meaningful…
      </Text>
      <Box position="absolute" left={0} right={0} bottom={0} h="10" bgGradient="linear(to-t, white, transparent)" pointerEvents="none" />
    </Box>
  )
}

/* ---------- Notes: a textarea that saves as you type ---------- */
export function NotesDemo() {
  const [v, setV] = useState("")
  const [state, setState] = useState("idle")
  const t = useRef()
  useEffect(() => {
    if (state !== "typing") return
    t.current = setTimeout(() => setState("saved"), 700)
    return () => clearTimeout(t.current)
  }, [v, state])
  return (
    <Flex direction="column" h="100%" bg="white">
      <Box px={4} pt={4} pb={2}>
        <Text fontSize="2xs" fontWeight="semibold" color="gray.600" mb={1}>
          Auto Tags
        </Text>
        <Chip>Reference → Humanities → History</Chip>
      </Box>
      <Box flex="1" px={4} pb={2}>
        <Textarea
          value={v}
          onChange={(e) => {
            setV(e.target.value)
            setState("typing")
          }}
          placeholder="Start typing to add a note…"
          resize="none"
          h="100%"
          fontSize="sm"
          bg="gray.50"
          borderColor="gray.200"
          borderRadius="md"
          _focus={{ borderColor: "brand.300", boxShadow: "none" }}
          aria-label="Demo note"
        />
      </Box>
      <Flex px={4} pb={3} justify="flex-end" fontSize="xs" color="gray.500" minH="5">
        {state === "typing" ? "Saving…" : state === "saved" ? "Saved" : ""}
      </Flex>
    </Flex>
  )
}
