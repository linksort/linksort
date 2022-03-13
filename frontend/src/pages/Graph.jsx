import React, { useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { Box } from "@chakra-ui/react";

import ErrorScreen from "../components/ErrorScreen";
import NullScreen from "../components/NullScreen";
import LoadingScreen from "../components/LoadingScreen";
import { useLinks } from "../hooks/links";

let graph;

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
      tags.add(p);
      edges.push({ from: p, to: l.id });
    });

    nodes.push({
      id: l.id,
      label: l.title,
      shape: "dot",
      group: maxConfidence(l.tagDetails),
      size: 10,
    });
  });

  tags.forEach((t) => {
    const split = t.split("/");

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
      label: split[split.length - 1],
      shape: "triangle",
      group: split[0],
    });
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
    size: 1000,
  });
  const graphRef = useRef();

  useEffect(() => {
    if (graphRef.current && links.length > 0 && !graph) {
      const { nodes, edges } = determineNodesAndEdges(links);
      graph = new Network(
        graphRef.current,
        {
          nodes: new DataSet(nodes),
          edges: new DataSet(edges),
        },
        {
          edges: {
            smooth: {
              type: "continuous",
            },
          },
        }
      );
    }

    return () => {
      graph = null;
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
      height="calc(100vh - 5rem)"
      width="100%"
      borderRightColor="gray.100"
      borderRightWidth="thin"
      borderLeftColor="gray.100"
      borderLeftWidth="thin"
      ref={graphRef}
    />
  );
}
