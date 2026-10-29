import React, { useLayoutEffect, useState } from "react";
import { Box, Portal } from "@chakra-ui/react";

const GAP = 8;
const MARGIN = 8;

/**
 * A small floating surface positioned next to a viewport rectangle (a text
 * selection or a <mark>). Prefers `placement` ("top" or "bottom") and flips
 * when there is no room; stays within the viewport horizontally. Uses the
 * floating glow from DESIGN.md and the 3xl pill radius by default.
 */
export default function FloatingAnchored({
  rect,
  placement = "top",
  children,
  zIndex = 1400,
  ...rest
}) {
  // Portal mounts its children a tick after the first render, so a plain ref
  // would be null when the layout effect first runs; state re-runs it.
  const [el, setEl] = useState(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999, placed: placement });

  useLayoutEffect(() => {
    if (!el || !rect) return;

    const { width, height } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let placed = placement;
    let top;
    if (placement === "top") {
      top = rect.top - height - GAP;
      if (top < MARGIN) {
        placed = "bottom";
        top = rect.bottom + GAP;
      }
    } else {
      top = rect.bottom + GAP;
      if (top + height > vh - MARGIN) {
        placed = "top";
        top = rect.top - height - GAP;
      }
    }

    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(MARGIN, Math.min(left, vw - width - MARGIN));
    top = Math.max(MARGIN, Math.min(top, vh - height - MARGIN));

    setPos({ top, left, placed });
  }, [el, rect, placement]);

  if (!rect) return null;

  return (
    <Portal>
      <Box
        ref={setEl}
        position="fixed"
        top={`${pos.top}px`}
        left={`${pos.left}px`}
        zIndex={zIndex}
        backgroundColor="white"
        borderWidth="thin"
        borderColor="gray.200"
        borderRadius="3xl"
        boxShadow="rgba(0, 0, 0, 0.1) 0px 0px 24px -2px"
        data-placement={pos.placed}
        {...rest}
      >
        {children}
      </Box>
    </Portal>
  );
}
