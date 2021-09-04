import React from "react";
import { Text, Link } from "@chakra-ui/react";

export default function MouseType({ align = "center", ...rest }) {
  return (
    <Text align={align} {...rest}>
      Copyright &copy; {new Date().getFullYear()} Linksort LLC &middot;{" "}
      <Link href="https://linksort.com/terms" isExternal whiteSpace="nowrap">
        Terms of service
      </Link>{" "}
      &middot;{" "}
      <Link href="https://linksort.com/privacy" isExternal whiteSpace="nowrap">
        Privacy policy
      </Link>{" "}
      &middot;{" "}
      <Link href="https://linksort.com/rss.xml" isExternal>
        RSS
      </Link>
    </Text>
  );
}
