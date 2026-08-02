"use client";

import { Box, Text, VStack } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function GhEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <VStack
      gap="phi3"
      py="phi5"
      px="phi4"
      textAlign="center"
      borderRadius="2xl"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="border.strong"
      bg="blackAlpha.300"
    >
      {Icon ? (
        <Box
          w="12"
          h="12"
          borderRadius="xl"
          bg="brand.muted"
          color="brand.fg"
          borderWidth="1px"
          borderColor="border.brand"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={22} />
        </Box>
      ) : null}
      <Box>
        <Text
          fontFamily="heading"
          fontWeight="extrabold"
          fontSize="md"
          letterSpacing="0.04em"
        >
          {title}
        </Text>
        {description ? (
          <Text fontSize="sm" color="fg.muted" mt="phi1" maxW="20rem" mx="auto" lineHeight="1.55">
            {description}
          </Text>
        ) : null}
      </Box>
      {action}
    </VStack>
  );
}
