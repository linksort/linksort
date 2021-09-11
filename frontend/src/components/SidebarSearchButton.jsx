import React from "react";
import { Search2Icon } from "@chakra-ui/icons";

import SidebarPopover from "./SidebarPopover";
import { useFilters } from "../hooks/filters";

export default function SidebarSearchButton() {
  const { handleSearch } = useFilters();

  return (
    <SidebarPopover
      onSubmit={handleSearch}
      placeholder="Type your query..."
      buttonText="Search"
      buttonIcon={Search2Icon}
    />
  );
}
