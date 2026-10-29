import React, { useCallback, useEffect, useRef } from "react";
import { Textarea } from "@chakra-ui/react";

/**
 * A Chakra Textarea that grows with its content (and shrinks back), capped
 * by maxHeight. Forwards the ref so callers can focus it.
 */
const AutoGrowTextarea = React.forwardRef(function AutoGrowTextarea(
  { value, minRows = 2, maxHeight = "20rem", onChange, ...props },
  forwardedRef
) {
  const innerRef = useRef(null);

  const setRefs = useCallback(
    (el) => {
      innerRef.current = el;
      if (typeof forwardedRef === "function") {
        forwardedRef(el);
      } else if (forwardedRef) {
        forwardedRef.current = el;
      }
    },
    [forwardedRef]
  );

  const resize = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <Textarea
      ref={setRefs}
      value={value}
      rows={minRows}
      onChange={(e) => {
        onChange && onChange(e);
        resize();
      }}
      resize="none"
      overflowY="auto"
      maxHeight={maxHeight}
      {...props}
    />
  );
});

export default AutoGrowTextarea;
