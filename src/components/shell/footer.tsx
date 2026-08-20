"use client";

import Link from "next/link";
import { Box, Flex, Text, VStack, HStack, SimpleGrid } from "@chakra-ui/react";
import { BRAND } from "@/lib/art";
import { homeHref, primaryNavForSession } from "@/lib/nav";
import { useSession } from "@/components/providers/session-context";
import { isPlatformAdmin } from "@/lib/profile";

/**
 * Site footer — full-bleed bar (edge-to-edge like the header),
 * inner content aligned to the same max width / padding.
 */
export function Footer() {
  const { isLoggedIn, profile } = useSession();
  const nav = primaryNavForSession(isLoggedIn, {
    isAdmin: isPlatformAdmin(profile?.role),
  });
  const year = new Date().getFullYear();

  return (
    <Box
      as="footer"
      className="gh-footer"
      w="100%"
      mt="phi4"
      borderTopWidth="1px"
      borderColor="border.default"
      bg="rgba(12,12,14,0.88)"
      backdropFilter="blur(18px)"
    >
      {/* Full-width brand rail — same language as header */}
      <Box className="gh-brand-bar" h="1" w="100%" />

      <Box
        maxW="84rem"
        mx="auto"
        w="100%"
        px={{ base: 3, md: 6, xl: 10 }}
        pt="phi5"
        pb={{
          base: "calc(var(--gh-bottom-nav-h, 72px) + var(--gh-safe-bottom, 0px) + 1.25rem)",
          md: "phi6",
        }}
      >
        {/* Brand row */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          align={{ base: "flex-start", sm: "center" }}
          justify="space-between"
          gap="phi4"
          mb="phi5"
        >
          <Link href={homeHref(isLoggedIn)} style={{ textDecoration: "none" }}>
            <HStack gap="phi3">
              <Box
                w="10"
                h="10"
                borderRadius="xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor="border.brand"
                boxShadow="0 0 16px rgba(163, 255, 61, 0.32)"
                bg="bg.elevated"
                flexShrink={0}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BRAND.mark128}
                  alt=""
                  width={40}
                  height={40}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
              <Box>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize={{ base: "md", sm: "lg" }}
                  letterSpacing="0.06em"
                  className="gh-text-brand"
                >
                  GAMERHOLIC
                </Text>
                <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                  I Win For A Living
                </Text>
              </Box>
            </HStack>
          </Link>
          <Text
            fontSize={{ base: "sm", md: "md" }}
            color="fg.muted"
            maxW="24rem"
            lineHeight="1.55"
          >
            Skill games · heads-up · arcade · on Internet Computer.
          </Text>
        </Flex>

        {/* Nav grid */}
        <SimpleGrid columns={{ base: 2, sm: 4, md: 6 }} gap="phi3" mb="phi5">
          {nav.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Text
                fontFamily="heading"
                fontSize="sm"
                fontWeight="bold"
                letterSpacing="0.04em"
                color="fg.muted"
                _hover={{ color: "brand.fg" }}
              >
                {item.label}
              </Text>
            </Link>
          ))}
          <Link href="/community" style={{ textDecoration: "none", color: "inherit" }}>
            <Text
              fontFamily="heading"
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="0.04em"
              color="fg.muted"
              _hover={{ color: "brand.fg" }}
            >
              Community
            </Text>
          </Link>
          <Link href="/wallet" style={{ textDecoration: "none", color: "inherit" }}>
            <Text
              fontFamily="heading"
              fontSize="sm"
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
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="0.04em"
              color="fg.muted"
              _hover={{ color: "brand.fg" }}
            >
              Profile
            </Text>
          </Link>
          <Link
            href="/security"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Text
              fontFamily="heading"
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="0.04em"
              color="fg.muted"
              _hover={{ color: "brand.fg" }}
            >
              Security tips
            </Text>
          </Link>
          <Link
            href="mailto:support@gamerholic.fun"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Text
              fontFamily="heading"
              fontSize="sm"
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
          gap="phi3"
          borderTopWidth="1px"
          borderColor="border.default"
          pt="phi4"
          w="100%"
        >
          <Flex
            direction={{ base: "column", sm: "row" }}
            align={{ base: "flex-start", sm: "center" }}
            gap={{ base: "3", sm: "4" }}
            w="100%"
            maxW="40rem"
            mx={{ base: 0, sm: "auto" }}
          >
            <Box
              as="span"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              px="4"
              py="2"
              minW="4rem"
              borderRadius="lg"
              borderWidth="2px"
              borderColor="prize.solid"
              bg="prize.muted"
              color="prize.fg"
              fontFamily="heading"
              fontSize="xl"
              fontWeight="extrabold"
              letterSpacing="0.06em"
              lineHeight="1"
              flexShrink={0}
              title="Adults only — 18 years of age or older"
            >
              18+
            </Box>
            <Text
              fontSize={{ base: "md", md: "lg" }}
              color="fg.default"
              fontWeight="medium"
              lineHeight="1.5"
            >
              For users{" "}
              <Text as="span" fontWeight="extrabold" color="prize.fg">
                18 years of age and older
              </Text>
              . Where skilled gaming is legal.
            </Text>
          </Flex>

          <Text fontSize="sm" color="fg.subtle" fontWeight="medium">
            © {year} Gamerholic
          </Text>

          <HStack
            gap={{ base: "4", sm: "6" }}
            flexWrap="wrap"
            justify={{ base: "flex-start", sm: "center" }}
          >
            <Text
              as="span"
              fontFamily="heading"
              fontSize={{ base: "md", sm: "lg" }}
              fontWeight="extrabold"
              letterSpacing="0.04em"
              color="fg.muted"
              cursor="default"
              _hover={{ color: "brand.fg" }}
            >
              Privacy
            </Text>
            <Text
              as="span"
              fontSize="md"
              color="fg.subtle"
              opacity={0.5}
              aria-hidden
            >
              ·
            </Text>
            <Text
              as="span"
              fontFamily="heading"
              fontSize={{ base: "md", sm: "lg" }}
              fontWeight="extrabold"
              letterSpacing="0.04em"
              color="fg.muted"
              cursor="default"
              _hover={{ color: "brand.fg" }}
            >
              User agreement
            </Text>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
