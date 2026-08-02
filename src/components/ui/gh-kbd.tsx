"use client";

import { Box, type BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export function GhKbd({
  children,
  ...rest
}: BoxProps & { children: ReactNode }) {
  return (
    <Box
      as="kbd"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      minW="1.5rem"
      px="1.5"
      py="0.5"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border.strong"
      borderBottomWidth="2px"
      bg="blackAlpha.500"
      fontFamily="mono"
      fontSize="2xs"
      color="fg.muted"
      lineHeight="1"
      {...rest}
    >
      {children}
    </Box>
  );
}
