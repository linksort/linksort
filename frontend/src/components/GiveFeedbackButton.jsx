import React from "react";

import { Link } from "@chakra-ui/react";

export default function GiveFeedback({ children }) {
  return (
    <Link href="https://linksort.canny.io/feedback" isExternal>
      {children}
    </Link>
  );
}
