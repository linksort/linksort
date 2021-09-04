import React from "react";
import { Accordion } from "@chakra-ui/react";

import ErrorScreen from "../components/ErrorScreen";
import LinkItem from "../components/LinkItem";
import { useLinks } from "../hooks/links";

export default function Home() {
  const { data: links, isError, error } = useLinks({ pageNumber: 0 });

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  return (
    <Accordion borderBottom="unset" allowToggle>
      {links.map((link) => (
        <LinkItem key={link.id} link={link} />
      ))}
    </Accordion>
  );
}
