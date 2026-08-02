"use client";

import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { ATTRIBUTES, type AttributeId } from "@/lib/attributes";

/** Side-by-side stat rows with spark on the winner */
export function StatCompare({
  left,
  right,
  leftName = "A",
  rightName = "B",
  keys = ["power", "speed", "attack", "defense", "vitality"] as AttributeId[],
}: {
  left: Partial<Record<AttributeId, number>>;
  right: Partial<Record<AttributeId, number>>;
  leftName?: string;
  rightName?: string;
  keys?: AttributeId[];
}) {
  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.elevated"
      p="phi3"
    >
      <HStack justify="space-between" mb="phi3">
        <Text fontFamily="heading" fontSize="xs" fontWeight="bold" color="brand.fg">
          {leftName}
        </Text>
        <Text fontFamily="heading" fontSize="2xs" color="fg.subtle" letterSpacing="0.14em">
          STAT EDGE
        </Text>
        <Text fontFamily="heading" fontSize="xs" fontWeight="bold" color="prize.fg">
          {rightName}
        </Text>
      </HStack>
      <Box display="flex" flexDirection="column" gap="phi2">
        {keys.map((id) => {
          const meta = ATTRIBUTES.find((a) => a.id === id);
          const lv = left[id] ?? 0;
          const rv = right[id] ?? 0;
          const lWin = lv > rv;
          const rWin = rv > lv;
          const tie = lv === rv;
          return (
            <Box key={id}>
              <Flex justify="space-between" mb="1" align="center">
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  fontFamily="heading"
                  color={lWin ? meta?.color : "fg.subtle"}
                  className={lWin ? "gh-stat-spark" : undefined}
                >
                  {lv}
                </Text>
                <Text fontSize="2xs" fontWeight="bold" color={meta?.color ?? "fg.muted"}>
                  {meta?.short}
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  fontFamily="heading"
                  color={rWin ? meta?.color : "fg.subtle"}
                  className={rWin ? "gh-stat-spark" : undefined}
                >
                  {rv}
                </Text>
              </Flex>
              <Flex gap="1" h="1.5" align="center">
                <Box flex="1" display="flex" justifyContent="flex-end" bg="bg.muted" borderRadius="full" overflow="hidden" h="100%">
                  <Box
                    h="100%"
                    w={`${lv}%`}
                    bg={lWin || tie ? meta?.color : `${meta?.color}66`}
                    borderRadius="full"
                    transition="width 0.4s ease"
                  />
                </Box>
                <Box flex="1" bg="bg.muted" borderRadius="full" overflow="hidden" h="100%">
                  <Box
                    h="100%"
                    w={`${rv}%`}
                    bg={rWin || tie ? meta?.color : `${meta?.color}66`}
                    borderRadius="full"
                    transition="width 0.4s ease"
                  />
                </Box>
              </Flex>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
