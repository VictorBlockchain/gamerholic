"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { primaryNavForSession, tabFromPath, type NavItem } from "@/lib/nav";
import { useSession } from "@/components/providers/session-context";
import { CreateSheet } from "@/components/modals/create-sheet";

/**
 * Mobile bottom tabs with center Create FAB (legacy pattern).
 * Logged-in: Dashboard · Challenge · [+] · Arcade · Community
 * Guest: Arcade · [+] · Community
 * Host / room create live in the Create sheet.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const active = tabFromPath(pathname);
  const { isLoggedIn } = useSession();
  const [createOpen, setCreateOpen] = useState(false);

  // Exclude Host from bar — center FAB opens Create (tournament / room / etc.)
  // Honor mobile:false (e.g. Rooms lives in header / create sheet only).
  const tabs = primaryNavForSession(isLoggedIn).filter(
    (t) => t.mobile !== false && t.id !== "host",
  );
  const mid = Math.floor(tabs.length / 2);
  const left = tabs.slice(0, mid);
  const right = tabs.slice(mid);

  return (
    <>
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
        // Allow center FAB to rise above the bar
        overflow="visible"
      >
        <Box
          position="absolute"
          inset="0"
          bg="bg.glass"
          backdropFilter="blur(20px)"
          borderTopWidth="1px"
          borderColor="border.default"
          // Keep glass under tabs only — FAB sits above
          zIndex={0}
        />
        <Box
          className="gh-brand-bar"
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="1"
          zIndex={1}
        />

        <Flex
          position="relative"
          zIndex={2}
          px="1"
          pt="2"
          pb="1"
          align="flex-end"
          justify="space-around"
          minH="64px"
          overflow="visible"
        >
          {left.map((item) => (
            <TabButton
              key={item.id}
              item={item}
              active={active === item.id}
              onClick={() => router.push(item.href)}
            />
          ))}

          {/* Center Create FAB — legacy middle action button */}
          <Box
            flex="1"
            maxW="5.5rem"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-end"
            pb="0.5"
            position="relative"
            zIndex={3}
          >
            <Box
              as="button"
              aria-label="Create"
              onClick={() => setCreateOpen(true)}
              w="3.5rem"
              h="3.5rem"
              mt="-1.75rem"
              borderRadius="full"
              bg="brand.solid"
              color="black"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 0 0 4px rgba(12,12,14,0.95), 0 0 28px rgba(163,255,61,0.6)"
              borderWidth="2px"
              borderColor="brand.fg"
              cursor="pointer"
              className="gh-fab-glow"
              transition="transform 0.15s"
              _hover={{ transform: "scale(1.06)" }}
              _active={{ transform: "scale(0.94)" }}
            >
              <Plus size={28} strokeWidth={2.5} />
            </Box>
            <Text
              fontSize="2xs"
              fontWeight="bold"
              fontFamily="heading"
              letterSpacing="0.04em"
              color="brand.fg"
              mt="0.5"
            >
              Create
            </Text>
          </Box>

          {right.map((item) => (
            <TabButton
              key={item.id}
              item={item}
              active={active === item.id}
              onClick={() => router.push(item.href)}
            />
          ))}
        </Flex>
      </Box>

      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
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
