"use client";

import { Box, Text } from "@chakra-ui/react";
import type { AttributeId } from "@/lib/attributes";
import { ATTRIBUTES } from "@/lib/attributes";

const ORDER: AttributeId[] = [
  "power",
  "speed",
  "attack",
  "defense",
  "luck",
  "vitality",
];

function polar(cx: number, cy: number, r: number, i: number, n: number) {
  const a = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Hexagonal radar for fighter stats */
export function StatRadar({
  stats,
  size = 160,
  color = "#6366f1",
  compare,
  compareColor = "#d97706",
}: {
  stats: Partial<Record<AttributeId, number>>;
  size?: number;
  color?: string;
  compare?: Partial<Record<AttributeId, number>>;
  compareColor?: string;
}) {
  const n = ORDER.length;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;

  const rings = [0.33, 0.66, 1].map((t) => {
    const pts = ORDER.map((_, i) => {
      const p = polar(cx, cy, maxR * t, i, n);
      return `${p.x},${p.y}`;
    }).join(" ");
    return pts;
  });

  const poly = (s: Partial<Record<AttributeId, number>>) =>
    ORDER.map((id, i) => {
      const v = Math.min(100, s[id] ?? 0) / 100;
      const p = polar(cx, cy, maxR * v, i, n);
      return `${p.x},${p.y}`;
    }).join(" ");

  return (
    <Box position="relative" w={size} h={size} mx="auto">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="1"
          />
        ))}
        {ORDER.map((_, i) => {
          const p = polar(cx, cy, maxR, i, n);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgba(148,163,184,0.15)"
              strokeWidth="1"
            />
          );
        })}
        {compare ? (
          <polygon
            points={poly(compare)}
            fill={`${compareColor}33`}
            stroke={compareColor}
            strokeWidth="1.5"
          />
        ) : null}
        <polygon
          points={poly(stats)}
          fill={`${color}44`}
          stroke={color}
          strokeWidth="2"
          className="gh-radar-poly"
        />
        {ORDER.map((id, i) => {
          const meta = ATTRIBUTES.find((a) => a.id === id);
          const p = polar(cx, cy, maxR + 14, i, n);
          return (
            <text
              key={id}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={meta?.color ?? "#94a3b8"}
              fontSize="9"
              fontFamily="var(--font-display), sans-serif"
              fontWeight="700"
            >
              {meta?.short ?? id}
            </text>
          );
        })}
      </svg>
      <Text
        position="absolute"
        bottom="1"
        left="0"
        right="0"
        textAlign="center"
        fontSize="2xs"
        color="fg.subtle"
        fontFamily="heading"
      >
        STAT RADAR
      </Text>
    </Box>
  );
}
