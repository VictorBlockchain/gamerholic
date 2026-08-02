"use client";

import { useEffect, useState } from "react";
import { Text, type TextProps } from "@chakra-ui/react";

/** Animated number for host bank / arcade bank spectacle */
export function CountUp({
  value,
  duration = 900,
  decimals = 1,
  suffix = "",
  prefix = "",
  ...textProps
}: {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
} & TextProps) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // ease-out cubic
      const e = 1 - Math.pow(1 - p, 3);
      setN(from + (value - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <Text as="span" fontVariantNumeric="tabular-nums" {...textProps}>
      {prefix}
      {n.toFixed(decimals)}
      {suffix}
    </Text>
  );
}
