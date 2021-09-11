import React from "react";
import { Button } from "@chakra-ui/react";

export default function SidebarButton(props) {
  return (
    <Button
      variant="ghost"
      width="100%"
      justifyContent="flex-start"
      paddingLeft="0.5rem"
      marginLeft="-0.5rem"
      color="gray.800"
      fontWeight="normal"
      letterSpacing="0.015rem"
      {...props}
    />
  );
}
