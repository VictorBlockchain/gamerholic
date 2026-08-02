"use client";

import Link from "next/link";
import { Box, Flex, Text, VStack, HStack, SimpleGrid } from "@chakra-ui/react";
import { BRAND } from "@/lib/art";
import { primaryNavForSession } from "@/lib/nav";
import { useSession } from "@/components/providers/session-context";

/**
 * Shared site footer — mobile-first, rendered on all pages (above bottom tabs).
 */
export function Footer() {
  const { isLoggedIn } = useSession();
  const nav = primaryNavForSession(isLoggedIn);
  const year = new Date().getFullYear();

  return (
    <Box
      as="footer"
      className="gh-footer"
      mt="phi4"
      px={{ base: 3, md: 6, xl: 10 }}
      pt="phi4"
      pb={{
        base: "calc(var(--gh-bottom-nav-h, 72px) + var(--gh-safe-bottom, 0px) + 1rem)",
        md: "phi5",
      }}
      borderTopWidth="1px"
      borderColor="border.default"
      bg="rgba(7,6,18,0.55)"
    >
      <Box maxW="84rem" mx="auto" w="100%">
        <Box className="gh-brand-bar" h="1" mb="phi3" opacity={0.7} borderRadius="full" />

        {/* Brand row */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          align={{ base: "flex-start", sm: "center" }}
          justify="space-between"
          gap="phi3"
          mb="phi4"
        >
          <HStack gap="phi2">
            <Box
              w="8"
              h="8"
              borderRadius="lg"
              overflow="hidden"
              borderWidth="1px"
              borderColor="border.brand"
              boxShadow="0 0 12px rgba(163, 255, 61, 0.28)"
              bg="bg.elevated"
              flexShrink={0}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND.mark128}
                alt=""
                width={32}
                height={32}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Box>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="sm"
                letterSpacing="0.06em"
              >
                GAMERHOLIC
              </Text>
              <Text fontSize="2xs" color="fg.subtle">
                I Win For A Living
              </Text>
            </Box>
          </HStack>
          <Text fontSize="xs" color="fg.subtle" maxW="20rem" lineHeight="1.5">
            Skill games · heads-up · arcade · on Internet Computer.
          </Text>
        </Flex>

        {/* Nav grid — mobile first 2-col */}
        <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi3" mb="phi4">
          {nav.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Text
                fontFamily="heading"
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="0.04em"
                color="fg.muted"
                _hover={{ color: "brand.fg" }}
              >
                {item.label}
              </Text>
            </Link>
          ))}
          <Link href="/wallet" style={{ textDecoration: "none", color: "inherit" }}>
            <Text
              fontFamily="heading"
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.04em"
              color="fg.muted"
              _hover={{ color: "brand.fg" }}
            >
              Wallet
            </Text>
          </Link>
          <Link href="/profile" style={{ textDecoration: "none", color: "inherit" }}>
            <Text
              fontFamily="heading"
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.04em"
              color="fg.muted"
              _hover={{ color: "brand.fg" }}
            >
              Profile
            </Text>
          </Link>
          <Link
            href="mailto:support@gamerholic.fun"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Text
              fontFamily="heading"
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.04em"
              color="fg.muted"
              _hover={{ color: "brand.fg" }}
            >
              Support
            </Text>
          </Link>
        </SimpleGrid>

        <VStack
          align={{ base: "flex-start", sm: "center" }}
          gap="2"
          borderTopWidth="1px"
          borderColor="border.default"
          pt="phi3"
        >
          <Text fontSize="2xs" color="fg.subtle">
            © {year} Gamerholic
          </Text>
          <HStack gap="3" fontSize="2xs" color="fg.subtle" flexWrap="wrap">
            <Text as="span">Privacy</Text>
            <Text as="span" opacity={0.4}>
              ·
            </Text>
            <Text as="span">User agreement</Text>
            <Text as="span" opacity={0.4}>
              ·
            </Text>
            <Link href="/ui-kit" style={{ color: "inherit" }}>
              UI kit
            </Link>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
