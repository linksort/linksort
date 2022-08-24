import React, { useEffect, useRef, useState } from "react";
import { Image } from "@chakra-ui/react";

export default function FadeInImage({ src, fallback, ...rest }) {
  const isMountedRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

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
    }
  }, [isMountedRef, src, isLoaded]);

  return (
    <Image
      src={src}
      opacity={isLoaded ? 1 : 0}
      transition="0.4s opacity"
      fallback={src.length > 0 ? null : fallback}
      {...rest}
    />
  );
}
