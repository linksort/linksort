import React, { useEffect, useRef } from "react";
import * as vis from "vis-network/standalone/umd";
import { Box } from "@chakra-ui/react";

import ErrorScreen from "../components/ErrorScreen";
import NullScreen from "../components/NullScreen";
import LoadingScreen from "../components/LoadingScreen";
import GraphInfoPanel from "../components/GraphInfoPanel";
import { useLinks } from "../hooks/links";
import { useState } from "react";

// This is a hack to get out of the React lifecycle and use vis.js
// without having React re-render the graph on every load.
window.graph = null;
window.graphNode = document.createElement("div");
window.graphNode.style.height = "calc(100vh - 5rem)";
window.graphNode.style.width = "100%";
window.setSelectedLinkId = () => { };

function maxConfidence(tagDetails) {
  let max = { name: "None", confidence: 0, path: "/None" };

  tagDetails.forEach((t) => {
    if (t.confidence > max.confidence) {
      max = t;
    }
  });

  return max.path.split("/")[1];
}

function determineNodesAndEdges(links) {
  const tags = new Set();
  const nodes = [];
  const edges = [];

  links.forEach((l) => {
    l.tagPaths.forEach((p) => {
      // Add each tagPath to the set of tags
      tags.add(p);
      // Link the tagPath to the node
      edges.push({ from: p, to: l.id });
    });

    if (l.tagPaths.length > 0) {
      nodes.push({
        id: l.id,
        label: l.title,
        shape: "dot",
        group: maxConfidence(l.tagDetails),
        size: 10,
        chosen: {
          node: (_, id) => window.setSelectedLinkId((_) => id),
        },
      });
    }
  });

  tags.forEach((t) => {
    const split = t.split("/");

    // Link each parent and child tag, e.g., 'Reference/Humanities' becomes
    // a 'Reference' node and a 'Humanities' node and a link from 'Reference'
    // to 'Reference/Humanities'
    if (split.length > 1) {
      let parent = "";
      for (let i = 0; i < split.length - 1; i++) {
        if (i === 0) {
          parent += split[i];
        } else {
          parent += "/" + split[i];
        }
      }

      let child = parent + "/" + split[split.length - 1];

      edges.push({
        from: parent,
        to: child,
      });
    }

    nodes.push({
      id: t,
      label: split[split.length - 1], // The most specific tag
      shape: "triangle",
      group: split[0], // The most general tag
    });
  });

  nodes.push({
    id: "None",
    label: "None",
    shape: "triangle",
    group: "None",
  });

  return { nodes, edges };
}

export default function Graph() {
  const {
    data: links,
    isError,
    error,
    isLoading,
    isFetching,
    failureCount,
  } = useLinks({
    overrides: { size: 1000 },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const [selectedLinkId, setSelectedLinkId] = useState("");
  const graphRef = useRef();
  const isMounted = useRef(false);

  window.setSelectedLinkId = setSelectedLinkId;

  useEffect(() => {
    if (graphRef.current && !isMounted.current) {
      graphRef.current.appendChild(window.graphNode);
      isMounted.current = true;
    }

    if (graphRef.current && links.length > 0 && !window.graph) {
      const { nodes, edges } = determineNodesAndEdges(links);
      window.graph = new vis.Network(
        window.graphNode,
        {
          nodes: new vis.DataSet(nodes),
          edges: new vis.DataSet(edges),
        },
        {
          nodes: {
            scaling: {
              min: 10,
              max: 30,
            },
            font: {
              size: 12,
              face: "Tahoma",
            },
          },
          edges: {
            width: 0.15,
            color: { inherit: "from" },
            smooth: {
              type: "continuous",
            },
          },
          physics: {
            stabilization: false,
            barnesHut: {
              gravitationalConstant: nodes.length > 100 ? -40000 : -10000,
              springConstant: 0.001,
              springLength: 1,
            },
          },
        }
      );
    }

    return () => {
      isMounted.current = false;
    };
  }, [links, graphRef]);

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  if (isLoading || failureCount > 0) {
    return <LoadingScreen />;
  }

  if (links.length === 0 && !isFetching) {
    return <NullScreen />;
  }

  return (
    <Box
      position="relative"
      borderRightColor="gray.100"
      borderRightWidth="thin"
      borderLeftColor="gray.100"
      borderLeftWidth="thin"
    >
      <Box height="calc(100vh - 5rem)" width="100%" ref={graphRef} zIndex={1} />
      <Box position="absolute" right={0} top={0} zIndex={2}>
        <GraphInfoPanel linkId={selectedLinkId} />
      </Box>
    </Box>
  );
}
