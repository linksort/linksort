import React from "react";
import { Button, forwardRef } from "@chakra-ui/react";

const SidebarButton = forwardRef((props, ref) => {
  const { leftIcon, ...rest } = props;

  const icon = React.cloneElement(leftIcon, {
    boxSize: "3.5",
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
      fontWeight="medium"
      fontSize="sm"
      letterSpacing="0"
      iconSpacing={2.5}
      borderRadius="md"
      _hover={{ bg: "gray.100" }}
      _active={{ bg: "gray.200" }}
      ref={ref}
      leftIcon={icon}
      {...rest}
    />
  );
});

export default SidebarButton;
