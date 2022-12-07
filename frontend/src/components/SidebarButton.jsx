import React from "react";
import { Button, forwardRef } from "@chakra-ui/react";

const SidebarButton = forwardRef((props, ref) => {
  const { leftIcon, ...rest } = props;

  const icon = React.cloneElement(leftIcon, {
    boxSize: "3",
  });

  return (
    <Button
      variant="ghost"
      width="100%"
      justifyContent="flex-start"
      height="7"
      paddingLeft="0.5rem"
      marginLeft="-0.5rem"
      color="gray.800"
      fontWeight="normal"
      fontSize="0.9rem"
      letterSpacing="0.01rem"
      ref={ref}
      leftIcon={icon}
      {...rest}
    />
  );
});

export default SidebarButton;
