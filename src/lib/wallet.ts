/**
 * Gamerholic wallet model:
 * - One play balance: ICP on a deterministic stake subaccount
 * - Assets As Attributes tokens (on-chain ICRC-style, mirrored in `gh_attribute_balances`)
 *
 * Challenges & tournaments stake ICP and/or Attribute tokens only.
 * No separate “main wallet” UI, WICP, or ckBTC on this surface.
 */

import { ATTRIBUTES, type AttributeId } from "@/lib/attributes";

export const DEMO_WALLET = {
  principal: "rdmx6-demo-principal",
  /** Deterministic subaccount for play — deposit here for stakes */
  subaccountAccount:
    "rdmx6-jaaaa-aaaaa-aaadq-cai-suba-a1b2c3d4e5f60718293a4b5c6d7e8f90",
  subaccountLabel: "Gamerholic play subaccount",
  /** ICP available for challenges, tournaments, transfers */
  subaccountIcp: 32.85,
} as const;

/** On-chain attribute token balances (demo — ledger + DB sync) */
export const DEMO_ATTRIBUTE_BALANCES: Record<AttributeId, number> = {
  power: 1280,
  speed: 940,
  attack: 1560,
  defense: 720,
  luck: 410,
  focus: 880,
  vitality: 1100,
  crit: 305,
};

export type AttributeBalanceRow = {
  id: AttributeId;
  name: string;
  short: string;
  symbol: string;
  color: string;
  icon: string;
  balance: number;
  blurb: string;
};

export function getAttributeBalanceRows(
  balances: Record<AttributeId, number> = DEMO_ATTRIBUTE_BALANCES,
): AttributeBalanceRow[] {
  return ATTRIBUTES.map((a) => ({
    id: a.id,
    name: a.name,
    short: a.short,
    symbol: a.symbol,
    color: a.color,
    icon: a.icon,
    balance: balances[a.id] ?? 0,
    blurb: a.blurb,
  }));
}

export function totalAttributeUnits(
  balances: Record<AttributeId, number> = DEMO_ATTRIBUTE_BALANCES,
): number {
  return Object.values(balances).reduce((s, n) => s + n, 0);
}

export type WalletTx = {
  id: string;
  kind: "deposit" | "transfer" | "stake" | "claim" | "host" | "attribute";
  label: string;
  amount: string;
  at: string;
  status: "confirmed" | "pending";
};

export const DEMO_WALLET_TX: WalletTx[] = [
  {
    id: "w1",
    kind: "deposit",
    label: "Deposit to play subaccount",
    amount: "+5.00 ICP",
    at: "2026-07-30T11:00:00",
    status: "confirmed",
  },
  {
    id: "w2",
    kind: "stake",
    label: "Challenge stake · Tekken vs iron_fist",
    amount: "-3.00 ICP",
    at: "2026-07-28T19:00:00",
    status: "confirmed",
  },
  {
    id: "w3",
    kind: "claim",
    label: "Claim prize · Tekken win",
    amount: "+5.70 ICP",
    at: "2026-07-28T19:45:00",
    status: "confirmed",
  },
  {
    id: "w4",
    kind: "host",
    label: "Host fee · Midweek Apex Cup",
    amount: "+0.54 ICP",
    at: "2026-07-20T21:40:00",
    status: "confirmed",
  },
  {
    id: "w5",
    kind: "attribute",
    label: "Received Power tokens · equip trade",
    amount: "+120 ghPWR",
    at: "2026-07-22T14:00:00",
    status: "confirmed",
  },
  {
    id: "w6",
    kind: "transfer",
    label: "Transfer out · to friend",
    amount: "-1.00 ICP",
    at: "2026-07-18T15:20:00",
    status: "confirmed",
  },
];

export function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function shortAccount(addr: string, head = 10, tail = 8) {
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
