"use client";

import { Box, Heading, Text, HStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <HStack
      align="flex-start"
      justify="space-between"
      gap="3"
      mb={{ base: "phi3", md: "phi4" }}
      flexWrap="wrap"
    >
      <Box minW="0">
        {kicker ? (
          <Text
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color="brand.fg"
            mb="1"
          >
            {kicker}
          </Text>
        ) : null}
        <Heading as="h1" size="lg" fontWeight="black" letterSpacing="tight">
          {title}
        </Heading>
        {description ? (
          <Text mt="1" fontSize="sm" color="fg.muted" maxW="md">
            {description}
          </Text>
        ) : null}
      </Box>
      {action}
    </HStack>
  );
}
