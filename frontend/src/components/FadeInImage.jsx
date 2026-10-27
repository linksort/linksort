import React, { useEffect, useRef, useState } from "react";
import { Image } from "@chakra-ui/react";

export default function FadeInImage({ src, fallback, ...rest }) {
  const isMountedRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBroken, setIsBroken] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  useEffect(() => {
    if (isMountedRef.current && !isLoaded) {
      const image = new window.Image();
      image.src = src;
      image.onload = () => {
        if (isMountedRef.current) {
          setTimeout(() => setIsLoaded(true), 50);
        }
      };
      image.onerror = () => {
        if (isMountedRef.current) {
          setIsBroken(true);
        }
      };
    }
  }, [isMountedRef, src, isLoaded]);

  // No source, or a source that failed to load: show the fallback instead of
  // an invisible image.
  if (!src || src.length === 0 || isBroken) {
    return fallback || null;
  }

  return (
    <Image
      src={src}
      opacity={isLoaded ? 1 : 0}
      transition="0.4s opacity"
      {...rest}
    />
  );
}
