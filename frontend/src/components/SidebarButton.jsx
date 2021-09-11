import React from "react";
import { Button, forwardRef } from "@chakra-ui/react";

const SidebarButton = forwardRef((props, ref) => (
  <Button
    variant="ghost"
    width="100%"
    justifyContent="flex-start"
    paddingLeft="0.5rem"
    marginLeft="-0.5rem"
    color="gray.800"
    fontWeight="normal"
    letterSpacing="0.015rem"
    ref={ref}
    {...props}
  />
));

export default SidebarButton;
