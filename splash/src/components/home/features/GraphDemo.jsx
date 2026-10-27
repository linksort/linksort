import React, { useMemo, useState } from "react"
import { Box, Text } from "@chakra-ui/react"
import { useReducedMotion } from "framer-motion"

import { GRAPH, LINKS } from "./collection"

// Lays each cluster out around a hand-placed center so the picture reads as
// the app's graph: topic triangles joined to link dots, clusters apart.
const CENTERS = [
  [24, 26], [16, 66], [36, 80], [68, 24], [88, 46], [50, 50], [64, 70], [84, 82],
]

function layout() {
  const nodes = []
  const edges = []
  GRAPH.clusters.forEach((c, ci) => {
    const [cx, cy] = CENTERS[ci]
    const items = [...c.topics.map((t) => ({ kind: "topic", label: t })), ...c.links.map((id) => ({ kind: "link", id }))]
    const r = items.length === 1 ? 0 : 7 + items.length * 1.2
    const ids = items.map((it, i) => {
      const a = (i / items.length) * Math.PI * 2 - Math.PI / 2
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r * 0.9
      const label = it.kind === "topic" ? it.label : LINKS.find((l) => l.id === it.id).title
      const id = `${ci}-${i}`
      nodes.push({ id, ci, kind: it.kind, label, x, y, color: c.color })
      return id
    })
    // Topics chain, each link connects to the first topic.
    for (let i = 0; i < c.topics.length - 1; i++) edges.push([ids[i], ids[i + 1], ci])
    for (let i = c.topics.length; i < ids.length; i++) edges.push([ids[0], ids[i], ci])
  })
  return { nodes, edges }
}

export default function GraphDemo() {
  const { nodes, edges } = useMemo(layout, [])
  const [hover, setHover] = useState(null)
  const reduce = useReducedMotion()
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])
  const hot = hover ? byId[hover].ci : null
  const hotNode = hover ? byId[hover] : null

  return (
    <Box
      position="relative"
      w="100%"
      h="100%"
      bg="white"
      overflow="hidden"
      onMouseLeave={() => setHover(null)}
      sx={
        reduce
          ? {}
          : {
              "@keyframes drift": {
                "0%": { transform: "translate(-50%, -50%)" },
                "50%": { transform: "translate(calc(-50% + 2px), calc(-50% - 3px))" },
                "100%": { transform: "translate(-50%, -50%)" },
              },
              ".drift": { animation: "drift 6s ease-in-out infinite" },
            }
      }
    >
      <Box as="svg" viewBox="0 0 100 100" preserveAspectRatio="none" w="100%" h="100%" display="block" position="absolute" inset={0}>
        {edges.map(([a, b, ci], i) => (
          <line
            key={i}
            x1={byId[a].x}
            y1={byId[a].y}
            x2={byId[b].x}
            y2={byId[b].y}
            stroke={byId[a].color}
            strokeWidth={hot === ci ? 0.6 : 0.3}
            opacity={hot === null || hot === ci ? 0.9 : 0.25}
            vectorEffect="non-scaling-stroke"
            style={{ transition: "opacity 0.2s ease" }}
          />
        ))}
      </Box>
      {/* Nodes and labels live in HTML so shapes stay true and type stays real at every size. */}
      {nodes.map((n, i) => {
        const dim = hot !== null && hot !== n.ci
        return (
          <Box
            key={n.id}
            as="button"
            type="button"
            aria-label={n.label}
            position="absolute"
            left={`${n.x}%`}
            top={`${n.y}%`}
            transform="translate(-50%, -50%)"
            w="14px"
            h="14px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            opacity={dim ? 0.3 : 1}
            transition="opacity 0.2s ease"
            onMouseEnter={() => setHover(n.id)}
            onFocus={() => setHover(n.id)}
            className={reduce ? undefined : "drift"}
            style={{ animationDelay: `${(i % 7) * -0.9}s` }}
            _focusVisible={{ outline: "none", boxShadow: "outline", borderRadius: "full" }}
          >
            {n.kind === "topic" ? (
              <Box as="svg" viewBox="0 0 14 14" w="14px" h="14px">
                <polygon points="7,1 13,12 1,12" fill={n.color} />
              </Box>
            ) : (
              <Box w="11px" h="11px" borderRadius="full" bg={n.color} />
            )}
          </Box>
        )
      })}
      {nodes
        .filter((n) => n.kind === "topic")
        .map((n) => (
          <Text
            key={n.id}
            position="absolute"
            left={`${n.x}%`}
            top={`${n.y}%`}
            transform="translate(-50%, 9px)"
            fontSize="2xs"
            color="gray.700"
            whiteSpace="nowrap"
            pointerEvents="none"
            opacity={hot !== null && hot !== n.ci ? 0.3 : 1}
            transition="opacity 0.2s ease"
          >
            {n.label}
          </Text>
        ))}
      <Box
        position="absolute"
        top={3}
        right={3}
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        px={3}
        py={2}
        fontSize="xs"
        color="gray.800"
        maxW="60%"
        pointerEvents="none"
        boxShadow="rgba(0,0,0,0.08) 0 4px 16px -4px"
      >
        {hotNode ? (
          <Text noOfLines={2}>{hotNode.label}</Text>
        ) : (
          <Text color="gray.500">Hover a node to see its cluster.</Text>
        )}
      </Box>
    </Box>
  )
}
