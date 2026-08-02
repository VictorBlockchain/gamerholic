"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Box, Flex, HStack, Text, IconButton, VStack } from "@chakra-ui/react";
import {
  ChevronDown,
  Coins,
  LifeBuoy,
  LogOut,
  Menu,
  User,
  Wallet,
  X,
} from "lucide-react";
import {
  ACCOUNT_MENU,
  primaryNavForSession,
  tabFromPath,
} from "@/lib/nav";
import { GhButton, GhAvatar } from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import { BRAND } from "@/lib/art";
import { loadArenaStats } from "@/lib/ic/gamer-service";
import { USERNAME_MAX_LENGTH } from "@/lib/profile";

/**
 * App header — brand · primary nav · Connect / account menu.
 * Nav: Dashboard · Challenge (connected) · Arcade · Rooms
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const active = tabFromPath(pathname);
  const { isLoggedIn, login, logout, user, principal, identity } =
    useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [icpBalance, setIcpBalance] = useState<number | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const nav = primaryNavForSession(isLoggedIn);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!isLoggedIn || !principal) {
      setIcpBalance(null);
      return;
    }
    let cancelled = false;
    void loadArenaStats(principal, identity)
      .then((s) => {
        if (!cancelled) setIcpBalance(s.subaccountIcp ?? 0);
      })
      .catch(() => {
        if (!cancelled) setIcpBalance(0);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, principal, identity]);

  const connect = () => {
    void login().then(() => router.push("/dashboard"));
  };

  const balanceLabel =
    icpBalance == null
      ? "… ICP"
      : `${icpBalance.toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })} ICP`;

  return (
    <>
      <Box
        as="header"
        className="gh-header"
        position="fixed"
        top="0"
        left="0"
        right="0"
        zIndex={40}
        bg={scrolled ? "bg.glass" : "rgba(12,12,14,0.72)"}
        backdropFilter="blur(18px)"
        borderBottomWidth="1px"
        borderColor="border.default"
        transition="background 0.2s ease"
      >
        <Box className="gh-brand-bar" h="1" w="100%" />

        <Flex
          h="14"
          px={{ base: 3, md: 6, xl: 10 }}
          align="center"
          justify="space-between"
          maxW="84rem"
          mx="auto"
          gap="phi2"
          w="100%"
        >
          <HStack gap="phi2" minW="0">
            <Link href="/" style={{ textDecoration: "none" }}>
              <HStack gap="phi2">
                <Box
                  w="9"
                  h="9"
                  borderRadius="xl"
                  overflow="hidden"
                  flexShrink={0}
                  boxShadow="0 0 16px rgba(163, 255, 61, 0.35)"
                  borderWidth="1px"
                  borderColor="border.brand"
                  bg="bg.elevated"
                  title="Gamerholic"
                >
                  {/* Power-G app icon — lime / prize neon raster */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={BRAND.mark128}
                    alt="Gamerholic"
                    width={36}
                    height={36}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </Box>
                <Text
                  className="gh-text-brand"
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize={{ base: "md", sm: "lg" }}
                  letterSpacing="0.06em"
                  lineHeight="1.1"
                >
                  GAMERHOLIC
                </Text>
              </HStack>
            </Link>
          </HStack>

          {/* Desktop primary nav */}
          <HStack gap="1" display={{ base: "none", lg: "flex" }}>
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <Box
                  key={item.id}
                  as="button"
                  onClick={() => router.push(item.href)}
                  px="3"
                  py="2"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={isActive ? "border.brand" : "transparent"}
                  bg={isActive ? "brand.muted" : "transparent"}
                  color={isActive ? "brand.fg" : "fg.muted"}
                  transition="all 0.15s"
                  _hover={{
                    borderColor: "border.brand",
                    color: "brand.fg",
                    bg: "whiteAlpha.50",
                  }}
                  cursor="pointer"
                >
                  <HStack gap="1.5">
                    <Icon size={15} />
                    <Text fontSize="sm" fontWeight="bold">
                      {item.label}
                    </Text>
                  </HStack>
                </Box>
              );
            })}
          </HStack>

          <HStack gap="2">
            {isLoggedIn ? (
              <Box ref={accountRef} position="relative">
                <Box
                  as="button"
                  onClick={() => setAccountOpen((o) => !o)}
                  display="inline-flex"
                  alignItems="center"
                  gap="1.5"
                  pl="1"
                  pr="2"
                  py="1"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor={accountOpen ? "border.brand" : "border.default"}
                  bg={accountOpen ? "brand.muted" : "blackAlpha.400"}
                  cursor="pointer"
                  transition="all 0.15s"
                  _hover={{ borderColor: "border.brand" }}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <GhAvatar
                    name={user?.username || "You"}
                    size="sm"
                    src={user?.avatarUrl}
                    tone="brand"
                  />
                  <Text
                    fontSize="2xs"
                    fontWeight="bold"
                    fontFamily="heading"
                    letterSpacing="0.02em"
                    display={{ base: "none", sm: "block" }}
                    maxW="6.5rem"
                    lineClamp={1}
                    color="fg.muted"
                  >
                    {(user?.username || "You").slice(0, USERNAME_MAX_LENGTH)}
                  </Text>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: accountOpen ? "rotate(180deg)" : undefined,
                      transition: "transform 0.15s",
                    }}
                  />
                </Box>

                {accountOpen ? (
                  <Box
                    role="menu"
                    position="absolute"
                    top="calc(100% + 8px)"
                    right="0"
                    minW="14rem"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="border.default"
                    bg="bg.elevated"
                    boxShadow="lg"
                    overflow="hidden"
                    zIndex={50}
                  >
                    <Box
                      px="3"
                      py="3"
                      borderBottomWidth="1px"
                      borderColor="border.default"
                      bg="blackAlpha.400"
                    >
                      <HStack gap="2">
                        <Box color="prize.fg">
                          <Coins size={16} />
                        </Box>
                        <Box>
                          <Text
                            fontSize="2xs"
                            fontWeight="bold"
                            letterSpacing="0.08em"
                            textTransform="uppercase"
                            color="fg.subtle"
                          >
                            Play balance
                          </Text>
                          <Text
                            fontFamily="heading"
                            fontWeight="extrabold"
                            fontSize="sm"
                            color="prize.fg"
                          >
                            {balanceLabel}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                    <VStack align="stretch" gap="0" py="1">
                      {ACCOUNT_MENU.map((item) => {
                        const Icon = item.icon;
                        const external = "external" in item && item.external;
                        return (
                          <Box
                            key={item.label}
                            as="button"
                            role="menuitem"
                            textAlign="left"
                            px="3"
                            py="2.5"
                            cursor="pointer"
                            _hover={{ bg: "whiteAlpha.100" }}
                            onClick={() => {
                              setAccountOpen(false);
                              if (external) {
                                window.location.href = item.href;
                              } else {
                                router.push(item.href);
                              }
                            }}
                          >
                            <HStack gap="2.5">
                              <Icon size={16} />
                              <Text fontSize="sm" fontWeight="semibold">
                                {item.label}
                              </Text>
                            </HStack>
                          </Box>
                        );
                      })}
                      <Box
                        as="button"
                        role="menuitem"
                        textAlign="left"
                        px="3"
                        py="2.5"
                        cursor="pointer"
                        color="danger.solid"
                        borderTopWidth="1px"
                        borderColor="border.default"
                        _hover={{ bg: "whiteAlpha.100" }}
                        onClick={() => {
                          setAccountOpen(false);
                          void logout();
                        }}
                      >
                        <HStack gap="2.5">
                          <LogOut size={16} />
                          <Text fontSize="sm" fontWeight="semibold">
                            Log out
                          </Text>
                        </HStack>
                      </Box>
                    </VStack>
                  </Box>
                ) : null}
              </Box>
            ) : (
              <GhButton
                size="sm"
                variant="primary"
                onClick={connect}
                display={{ base: "none", sm: "inline-flex" }}
              >
                Connect
              </GhButton>
            )}

            <IconButton
              aria-label="Open menu"
              variant="ghost"
              size="sm"
              display={{ base: "inline-flex", lg: "none" }}
              color="fg.muted"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </IconButton>
          </HStack>
        </Flex>
      </Box>

      {/* Mobile slide-down — same primary nav */}
      {menuOpen ? (
        <Box
          position="fixed"
          top="calc(56px + env(safe-area-inset-top, 0px))"
          left="0"
          right="0"
          zIndex={39}
          bg="bg.glass"
          backdropFilter="blur(20px)"
          borderBottomWidth="1px"
          borderColor="border.default"
          display={{ base: "block", lg: "none" }}
          p="3"
        >
          <Flex direction="column" gap="1">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <Box
                  key={item.id}
                  as="button"
                  textAlign="left"
                  onClick={() => router.push(item.href)}
                  px="3"
                  py="3"
                  borderRadius="xl"
                  bg={isActive ? "brand.muted" : "transparent"}
                  color={isActive ? "brand.fg" : "fg.default"}
                  borderWidth="1px"
                  borderColor={isActive ? "border.brand" : "transparent"}
                  cursor="pointer"
                >
                  <HStack gap="3">
                    <Icon size={18} />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm">
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text fontSize="xs" color="fg.subtle">
                          {item.description}
                        </Text>
                      ) : null}
                    </Box>
                  </HStack>
                </Box>
              );
            })}
            {!isLoggedIn ? (
              <GhButton variant="primary" w="full" mt="phi2" onClick={connect}>
                Connect
              </GhButton>
            ) : (
              <VStack align="stretch" gap="1" mt="phi2">
                <HStack
                  px="3"
                  py="2"
                  borderRadius="xl"
                  bg="prize.muted"
                  borderWidth="1px"
                  borderColor="prize.solid"
                >
                  <Coins size={16} color="var(--gh-colors-prize-fg)" />
                  <Text fontSize="sm" fontWeight="bold" color="prize.fg">
                    {balanceLabel}
                  </Text>
                </HStack>
                <Box
                  as="button"
                  textAlign="left"
                  px="3"
                  py="3"
                  borderRadius="xl"
                  cursor="pointer"
                  onClick={() => router.push("/profile")}
                >
                  <HStack gap="3">
                    <User size={18} />
                    <Text fontWeight="semibold" fontSize="sm">
                      Profile
                    </Text>
                  </HStack>
                </Box>
                <Box
                  as="button"
                  textAlign="left"
                  px="3"
                  py="3"
                  borderRadius="xl"
                  cursor="pointer"
                  onClick={() => router.push("/wallet")}
                >
                  <HStack gap="3">
                    <Wallet size={18} />
                    <Text fontWeight="semibold" fontSize="sm">
                      Wallet
                    </Text>
                  </HStack>
                </Box>
                <Box
                  as="button"
                  textAlign="left"
                  px="3"
                  py="3"
                  borderRadius="xl"
                  cursor="pointer"
                  onClick={() => {
                    window.location.href = "mailto:support@gamerholic.fun";
                  }}
                >
                  <HStack gap="3">
                    <LifeBuoy size={18} />
                    <Text fontWeight="semibold" fontSize="sm">
                      Support
                    </Text>
                  </HStack>
                </Box>
                <Box
                  as="button"
                  textAlign="left"
                  px="3"
                  py="3"
                  borderRadius="xl"
                  cursor="pointer"
                  color="danger.solid"
                  onClick={() => void logout()}
                >
                  <HStack gap="3">
                    <LogOut size={18} />
                    <Text fontWeight="semibold" fontSize="sm">
                      Log out
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            )}
          </Flex>
        </Box>
      ) : null}
    </>
  );
}
