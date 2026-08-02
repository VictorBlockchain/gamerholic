"use client";

import { Box, Text, type BoxProps } from "@chakra-ui/react";

export type GhAvatarProps = BoxProps & {
  name?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  tone?: "brand" | "prize" | "attr" | "live";
  status?: "online" | "live" | "offline";
};

const SIZES = {
  xs: { box: "7", font: "2xs", status: "1.5" },
  sm: { box: "9", font: "xs", status: "2" },
  md: { box: "11", font: "sm", status: "2.5" },
  lg: { box: "14", font: "md", status: "3" },
  xl: { box: "16", font: "lg", status: "3.5" },
} as const;

const BORDER = {
  brand: "border.brand",
  prize: "prize.solid",
  attr: "attr.solid",
  live: "live.solid",
} as const;

const FG = {
  brand: "brand.fg",
  prize: "prize.fg",
  attr: "attr.fg",
  live: "live.fg",
} as const;

function initials(name?: string) {
  if (!name) return "?";
  return (
    name
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function GhAvatar({
  name,
  src,
  size = "md",
  tone = "brand",
  status,
  ...rest
}: GhAvatarProps) {
  const s = SIZES[size];
  return (
    <Box position="relative" display="inline-block" flexShrink={0} {...rest}>
      <Box
        w={s.box}
        h={s.box}
        borderRadius="full"
        overflow="hidden"
        borderWidth="2px"
        borderColor={BORDER[tone]}
        bg="bg.elevated"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize={s.font}
            color={FG[tone]}
          >
            {initials(name)}
          </Text>
        )}
      </Box>
      {status && status !== "offline" ? (
        <Box
          position="absolute"
          bottom="0"
          right="0"
          w={s.status}
          h={s.status}
          borderRadius="full"
          borderWidth="2px"
          borderColor="bg.canvas"
          bg={status === "live" ? "danger.solid" : "success.solid"}
          boxShadow={status === "live" ? "0 0 8px rgba(244,63,94,0.6)" : undefined}
        />
      ) : null}
    </Box>
  );
}

export function GhAvatarGroup({
  names,
  max = 4,
  size = "sm",
}: {
  names: string[];
  max?: number;
  size?: GhAvatarProps["size"];
}) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <Box display="flex" alignItems="center">
      {shown.map((n, i) => (
        <Box key={`${n}-${i}`} ml={i === 0 ? 0 : "-2"} zIndex={shown.length - i}>
          <GhAvatar name={n} size={size} />
        </Box>
      ))}
      {extra > 0 ? (
        <Box
          ml="-2"
          w={SIZES[size ?? "sm"].box}
          h={SIZES[size ?? "sm"].box}
          borderRadius="full"
          bg="bg.muted"
          borderWidth="2px"
          borderColor="border.default"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={0}
        >
          <Text fontFamily="heading" fontSize="2xs" fontWeight="bold" color="fg.muted">
            +{extra}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
