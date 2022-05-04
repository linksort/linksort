import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";

// Copied from https://usehooks.com/useDebounce/
export function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}

// Copied from https://lo-victoria.com/a-look-at-react-hooks-usescrollposition-for-parallax-scrolling-effects
export function useScrollPosition() {
  const [position, setPosition] = useState(100);

  const onScroll = debounce(() => {
    setPosition(window.scrollY);
  }, 10);

  useEffect(() => {
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return position;
}

export function useScrollDirection() {
  const lastPosition = useRef(0);
  const position = useScrollPosition();

  useEffect(() => {
    lastPosition.current = position;
  }, [position]);

  return lastPosition.current >= position || position <= 100 ? "UP" : "DOWN";
}
