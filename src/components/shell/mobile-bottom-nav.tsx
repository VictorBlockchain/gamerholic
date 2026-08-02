"use client";

import { usePathname, useRouter } from "next/navigation";
import { Box, Flex, Text } from "@chakra-ui/react";
import { primaryNavForSession, tabFromPath, type NavItem } from "@/lib/nav";
import { useSession } from "@/components/providers/session-context";

/**
 * Mobile bottom tabs — Dashboard · Challenge · Host · Arcade · Rooms
 * (Challenge only when connected). Shared with header IA.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const active = tabFromPath(pathname);
  const { isLoggedIn } = useSession();
  const tabs = primaryNavForSession(isLoggedIn);

  return (
    <Box
      as="nav"
      className="gh-bottom-nav"
      display={{ base: "block", md: "none" }}
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      zIndex={50}
      aria-label="Primary"
    >
      <Box
        position="absolute"
        inset="0"
        bg="bg.glass"
        backdropFilter="blur(20px)"
        borderTopWidth="1px"
        borderColor="border.default"
      />
      <Box
        className="gh-brand-bar"
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="1"
      />

      <Flex
        position="relative"
        px="2"
        pt="2"
        pb="1"
        align="stretch"
        justify="space-around"
        minH="64px"
      >
        {tabs.map((item) => (
          <TabButton
            key={item.id}
            item={item}
            active={active === item.id}
            onClick={() => router.push(item.href)}
          />
        ))}
      </Flex>
    </Box>
  );
}

function TabButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Box
      as="button"
      onClick={onClick}
      flex="1"
      maxW="5.5rem"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="1"
      py="1.5"
      px="1"
      borderRadius="xl"
      bg={active ? "brand.muted" : "transparent"}
      color={active ? "brand.fg" : "fg.subtle"}
      borderWidth="1px"
      borderColor={active ? "border.brand" : "transparent"}
      cursor="pointer"
      transition="all 0.15s"
      _active={{ transform: "scale(0.96)" }}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      <Text
        fontSize="2xs"
        fontWeight="bold"
        fontFamily="heading"
        letterSpacing="0.04em"
        lineClamp={1}
      >
        {item.label}
      </Text>
    </Box>
  );
}
