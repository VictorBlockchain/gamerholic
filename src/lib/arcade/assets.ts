/**
 * Resolve equippable Dexsta game-asset XFTs for an arcade cabinet.
 *
 * Flow (when game.linkedLabelId is set):
 *  1) Dexsta getUserGameAssetXfts(player)
 *  2) Keep assets whose linkedTo / linkedLabelOf matches game.linkedLabelId
 *  3) Optionally prefer acceptedGameAssets roles/ids when listed
 *
 * If game has no linked label → return [] (skip equip entirely).
 */

import {
  listOwnedGameAssetsForLabel,
  type DexstaOwnedXft,
} from "@/lib/ic/dexsta-xft-service";
import type { ArcadeGame, EquippedGameAsset } from "@/lib/arcade/types";

const BASE_POWER: Record<string, number> = {
  weapon: 18,
  hat: 12,
  skin: 10,
  item: 10,
};

function basePower(role: string) {
  return BASE_POWER[role] ?? 10;
}

/**
 * Map owned Dexsta game assets → bridge equip payload.
 * Host injects these on gamerholic:init / gamerholic:assets.
 */
export async function resolvePlayerGameAssetsForGame(opts: {
  game: ArcadeGame;
  ownerPrincipal: string;
}): Promise<EquippedGameAsset[]> {
  const labelId = Math.floor(Number(opts.game.linkedLabelId) || 0);
  // No label on cabinet → skip all game-asset resolution
  if (labelId <= 0) return [];

  const owner = (opts.ownerPrincipal || "").trim();
  if (!owner || owner.includes("demo") || owner === "anon-player") {
    // No synthetic inventory — real principals only
    return [];
  }

  let owned: DexstaOwnedXft[] = [];
  try {
    owned = await listOwnedGameAssetsForLabel(owner, labelId);
  } catch (e) {
    console.warn("[arcade-assets] listOwnedGameAssetsForLabel failed", e);
    return [];
  }

  if (!owned.length) {
    return [];
  }

  const accepted = opts.game.acceptedGameAssets || [];
  const byId = new Map(accepted.map((a) => [a.tokenId, a]));

  // Prefer matching accepted token ids; also include other label-linked assets
  const picked: DexstaOwnedXft[] = [];
  const seen = new Set<number>();

  for (const a of accepted) {
    const hit = owned.find((o) => o.tokenId === a.tokenId);
    if (hit && !seen.has(hit.tokenId)) {
      picked.push(hit);
      seen.add(hit.tokenId);
    }
  }
  for (const o of owned) {
    if (!seen.has(o.tokenId)) {
      picked.push(o);
      seen.add(o.tokenId);
    }
  }

  return picked.slice(0, 12).map((o) => {
    const acc = byId.get(o.tokenId);
    const role = acc?.role || "item";
    // Bag power from Dexsta bag can be enriched later; 0 until wired
    const bagPowerTokens = 0;
    const effectivePower = basePower(role) + bagPowerTokens * 0.1;
    return {
      tokenId: o.tokenId,
      label: acc?.label || o.name || `Asset #${o.tokenId}`,
      role,
      bagPowerTokens,
      effectivePower,
      quantity: o.quantity || 1,
      imageUrl: o.imageUrl || undefined,
      linkedLabelId: o.linkedLabelId || labelId,
    } satisfies EquippedGameAsset;
  });
}
