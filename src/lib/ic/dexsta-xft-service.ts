/**
 * Dexsta XFT portfolio for Gamerholic profiles.
 * Lists type-8 media XFTs + game assets owned by a principal.
 */

import { Actor, type Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  createAgent,
  getIcHost,
  isLocalHost,
} from "./canisters";
import { dexstaMediaIdl, dexstaXftIdl } from "./dexsta-xft-idl";

function envOr(key: string, fallback = ""): string {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v.trim() : fallback;
}

const useMainnet =
  process.env.NEXT_PUBLIC_IC_NETWORK === "ic" ||
  (process.env.NEXT_PUBLIC_IC_HOST || "").includes("icp0.io") ||
  (process.env.NEXT_PUBLIC_IC_HOST || "").includes("ic0.app");

/** Dexsta XFT canister (local defaults match dexsta .dfx) */
export const DEXSTA_XFT_ID = envOr(
  "NEXT_PUBLIC_DEXSTA_XFT_CANISTER_ID",
  envOr(
    "NEXT_PUBLIC_XFT_CANISTER_ID",
    useMainnet ? "nj5wo-siaaa-aaaaf-qc3mq-cai" : "uzt4z-lp777-77774-qaabq-cai",
  ),
);

export const DEXSTA_MEDIA_ID = envOr(
  "NEXT_PUBLIC_DEXSTA_MEDIA_CANISTER_ID",
  envOr(
    "NEXT_PUBLIC_MEDIA_CANISTER_ID",
    useMainnet ? "nsykl-iqaaa-aaaaf-qc3oa-cai" : "vg3po-ix777-77774-qaafa-cai",
  ),
);

/** Optional HTTPS Dexsta app API (e.g. http://localhost:3000) */
export const DEXSTA_API_URL = envOr(
  "NEXT_PUBLIC_DEXSTA_API_URL",
  envOr("NEXT_PUBLIC_DEXSTA_APP_URL", ""),
).replace(/\/$/, "");

export type DexstaOwnedXft = {
  contract: string;
  tokenId: number;
  /** type-8 media (includes game assets) */
  xftType: number;
  quantity: number;
  name: string;
  gameAsset: boolean;
  /** Parent Lead Label id (settings.linkedTo) — 0 if none */
  linkedLabelId: number;
  imageUrl: string | null;
  hasAudio: boolean;
  hasVideo: boolean;
  uri: string | null;
};

function principalText(p: unknown): string | null {
  if (!p) return null;
  if (typeof (p as { toText?: () => string }).toText === "function") {
    return (p as { toText: () => string }).toText();
  }
  if (Array.isArray(p) && p.length > 0) return principalText(p[0]);
  const s = String(p);
  return s && s !== "undefined" && s !== "null" ? s : null;
}

function unwrapOpt<T>(v: unknown): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return (v[0] as T) ?? null;
  return v as T;
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "bigint") return Number(v);
  return Number(v) || 0;
}

/** Browser-safe display URL for media:// and ipfs:// */
export function toDisplayImageUrl(uri: string | null | undefined): string | null {
  if (!uri) return null;
  const u = String(uri).trim();
  if (!u) return null;
  if (u.startsWith("data:") || u.startsWith("blob:")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("ipfs://")) {
    const cid = u.replace("ipfs://", "").replace(/^ipfs\//, "");
    return cid ? `https://nftstorage.link/ipfs/${cid}` : null;
  }
  if (u.startsWith("media://")) {
    const parts = u.replace("media://", "").split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const canisterId = parts[0];
    const assetIdStr = parts[parts.length - 1];
    try {
      const host = getIcHost();
      if (isLocalHost(host)) {
        const port = host.includes(":")
          ? host.split(":").pop() || "4943"
          : "4943";
        return `http://${canisterId}.localhost:${port}/asset/${assetIdStr}`;
      }
    } catch {
      /* fall through */
    }
    return `https://${canisterId}.raw.icp0.io/asset/${assetIdStr}`;
  }
  return u;
}

export function isDexstaXftConfigured(): boolean {
  return Boolean(DEXSTA_XFT_ID && DEXSTA_XFT_ID.length > 5);
}

async function createXftActor(identity?: Identity | null) {
  if (!isDexstaXftConfigured()) return null;
  const agent = await createAgent(identity);
  return Actor.createActor(dexstaXftIdl as never, {
    agent,
    canisterId: DEXSTA_XFT_ID,
  }) as any;
}

async function createMediaActor(identity?: Identity | null) {
  if (!DEXSTA_MEDIA_ID || DEXSTA_MEDIA_ID.length < 5) return null;
  const agent = await createAgent(identity);
  return Actor.createActor(dexstaMediaIdl as never, {
    agent,
    canisterId: DEXSTA_MEDIA_ID,
  }) as any;
}

async function resolveCoverFromMedia(
  contract: string,
  tokenId: number,
  identity?: Identity | null,
): Promise<{ imageUrl: string | null; hasAudio: boolean; hasVideo: boolean }> {
  const out = {
    imageUrl: null as string | null,
    hasAudio: false,
    hasVideo: false,
  };
  try {
    const media = await createMediaActor(identity);
    if (!media) return out;
    const c = Principal.fromText(contract);
    for (const variant of ["cover", "original", "preview"]) {
      try {
        const opt = await media.getLatestByContractAndToken(
          c,
          BigInt(tokenId),
          variant,
        );
        const a = unwrapOpt<{ id: bigint | number }>(opt);
        if (!a) continue;
        out.imageUrl = toDisplayImageUrl(
          `media://${DEXSTA_MEDIA_ID}/${Number(a.id)}`,
        );
        if (out.imageUrl) break;
      } catch {
        /* missing variant */
      }
    }
    try {
      const aud = unwrapOpt(
        await media.getLatestByContractAndToken(c, BigInt(tokenId), "audio"),
      );
      if (aud) out.hasAudio = true;
    } catch {
      /* */
    }
    try {
      const vid = unwrapOpt(
        await media.getLatestByContractAndToken(c, BigInt(tokenId), "video"),
      );
      if (vid) out.hasVideo = true;
    } catch {
      /* */
    }
  } catch {
    /* media unavailable */
  }
  return out;
}

function mediaFromGetXft(raw: any): {
  imageUrl: string | null;
  hasAudio: boolean;
  hasVideo: boolean;
} {
  let imageUrl: string | null = null;
  let hasAudio = false;
  let hasVideo = false;
  const list = Array.isArray(raw?.media) ? raw.media : [];
  for (const entry of list) {
    const key = String(Array.isArray(entry) ? entry[0] : entry?.key || "").toLowerCase();
    const ref = Array.isArray(entry) ? entry[1] : entry;
    if (!ref) continue;
    const mt = String(ref.mediaType || "").toLowerCase();
    let rawSrc = "";
    if (ref.src?.IPFS) rawSrc = `ipfs://${ref.src.IPFS}`;
    else if (ref.src?.ICP != null && DEXSTA_MEDIA_ID) {
      rawSrc = `media://${DEXSTA_MEDIA_ID}/${Number(ref.src.ICP)}`;
    }
    if (
      key.includes("audio") ||
      mt.startsWith("audio/")
    ) {
      hasAudio = true;
      continue;
    }
    if (key.includes("video") || mt.startsWith("video/")) {
      hasVideo = true;
      continue;
    }
    if (
      !imageUrl &&
      (key.includes("cover") ||
        key.includes("original") ||
        key.includes("preview") ||
        key.includes("image") ||
        mt.startsWith("image/") ||
        rawSrc)
    ) {
      imageUrl = toDisplayImageUrl(rawSrc);
    }
  }
  return { imageUrl, hasAudio, hasVideo };
}

async function hydrateOne(
  contract: string,
  tokenId: number,
  forceGameAsset: boolean | null,
  identity?: Identity | null,
): Promise<DexstaOwnedXft | null> {
  try {
    const actor = await createXftActor(identity);
    if (!actor) return null;

    let xftType = 0;
    let quantity = 1;
    let name = `XFT #${tokenId}`;
    let gameAsset = forceGameAsset === true;
    let linkedLabelId = 0;
    let uri: string | null = null;
    let imageUrl: string | null = null;
    let hasAudio = false;
    let hasVideo = false;

    // Prefer getCardLight (cheap) then fill media
    if (typeof actor.getCardLight === "function") {
      try {
        const light = await actor.getCardLight(
          Principal.fromText(contract),
          BigInt(tokenId),
        );
        if (light?.exists) {
          xftType = toNum(light.xft_type);
          quantity = toNum(light.quantity) || 1;
          linkedLabelId = toNum(light.linked_to) || 0;
          uri = light.uri ? String(light.uri) : null;
          if (light.label_name) name = String(light.label_name);
          else if (light.ticker) name = String(light.ticker);
          if (typeof light.game_asset === "boolean") {
            gameAsset = light.game_asset;
          }
        }
      } catch {
        /* fall through to getXFT */
      }
    }

    if (typeof actor.getXFT === "function") {
      try {
        const raw = await actor.getXFT(
          Principal.fromText(contract),
          BigInt(tokenId),
        );
        if (raw?.exists === false) return null;
        const settings = unwrapOpt<any>(raw?.settings) ?? raw?.settings;
        if (settings) {
          xftType = toNum(settings.xftType) || xftType;
          quantity = toNum(settings.quantity) || quantity;
          linkedLabelId = toNum(settings.linkedTo) || linkedLabelId;
        }
        if (typeof raw?.gameAsset === "boolean") {
          gameAsset = raw.gameAsset;
        }
        const token = unwrapOpt<any>(raw?.token) ?? raw?.token;
        if (token?.uri) uri = String(token.uri);
        const fromMedia = mediaFromGetXft(raw);
        imageUrl = fromMedia.imageUrl;
        hasAudio = fromMedia.hasAudio;
        hasVideo = fromMedia.hasVideo;
      } catch {
        /* optional */
      }
    }

    // linkedLabelOf as final fallback (Dexsta query)
    if (linkedLabelId === 0 && typeof actor.linkedLabelOf === "function") {
      try {
        const opt = await actor.linkedLabelOf(BigInt(tokenId));
        const n = unwrapOpt<bigint | number>(opt);
        if (n != null) linkedLabelId = toNum(n);
      } catch {
        /* */
      }
    }

    // Only media (type 8) for profile gallery
    if (xftType !== 0 && xftType !== 8) return null;
    // If we couldn't read type, still include if forced game asset list
    if (xftType === 0 && forceGameAsset !== true) {
      // try continue — unknown type might still be media after media resolve
    }

    const cover = await resolveCoverFromMedia(contract, tokenId, identity);
    if (cover.imageUrl) imageUrl = cover.imageUrl;
    if (cover.hasAudio) hasAudio = true;
    if (cover.hasVideo) hasVideo = true;

    if (!imageUrl && uri) {
      imageUrl = toDisplayImageUrl(uri);
    }

    // Drop non-media when type known and not 8
    if (xftType !== 0 && xftType !== 8) return null;

    // Default unknown type rows from game-asset list as type 8
    if (xftType === 0 && forceGameAsset === true) xftType = 8;
    if (xftType === 0) return null;

    if (forceGameAsset === true) gameAsset = true;

    return {
      contract,
      tokenId,
      xftType,
      quantity,
      name: name || `Media #${tokenId}`,
      gameAsset,
      linkedLabelId,
      imageUrl,
      hasAudio,
      hasVideo,
      uri,
    };
  } catch {
    return null;
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]!);
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

/** HTTPS Dexsta API fallback when C2C not available. */
async function fetchViaApi(
  ownerText: string,
  gameAssetsOnly: boolean,
): Promise<DexstaOwnedXft[] | null> {
  if (!DEXSTA_API_URL) return null;
  try {
    const q = new URLSearchParams({
      owner: ownerText,
      detail: "1",
      limit: "40",
    });
    if (gameAssetsOnly) q.set("game_assets", "1");
    const res = await fetch(`${DEXSTA_API_URL}/api/xft/user?${q}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success?: boolean;
      xfts?: Array<Record<string, unknown>>;
    };
    if (!json.success || !Array.isArray(json.xfts)) return null;
    const out: DexstaOwnedXft[] = [];
    for (const x of json.xfts) {
      const xftType = toNum(x.xftType);
      if (!gameAssetsOnly && xftType !== 0 && xftType !== 8) continue;
      const tokenId = toNum(x.xftId ?? x.id);
      if (tokenId < 0) continue;
      const gameAsset = Boolean(x.game_asset ?? x.gameAsset ?? gameAssetsOnly);
      out.push({
        contract: String(x.contract || DEXSTA_XFT_ID),
        tokenId,
        xftType: xftType || 8,
        quantity: toNum(x.quantity) || 1,
        name: String(x.label || x.name || `XFT #${x.xftId ?? x.id}`),
        gameAsset,
        linkedLabelId: toNum(x.linkedTo ?? x.linked_to ?? 0),
        imageUrl: toDisplayImageUrl(
          (x.imageUri as string) || (x.metadataUri as string) || null,
        ),
        hasAudio: false,
        hasVideo: false,
        uri: (x.metadataUri as string) || null,
      });
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Owned type-8 media XFTs for a principal (includes game assets).
 */
export async function listOwnedMediaXfts(
  ownerText: string,
  identity?: Identity | null,
  limit = 40,
): Promise<DexstaOwnedXft[]> {
  if (!ownerText || ownerText.includes("demo")) {
    // Demo principal won't own chain assets — try API/canister anyway if real principal shape
    if (ownerText.includes("demo")) return [];
  }

  const viaApi = await fetchViaApi(ownerText, false);
  if (viaApi) {
    return viaApi
      .filter((x) => x.xftType === 8)
      .slice(0, limit);
  }

  if (!isDexstaXftConfigured()) return [];

  try {
    const owner = Principal.fromText(ownerText);
    const actor = await createXftActor(identity);
    if (!actor || typeof actor.getUserXfts !== "function") return [];

    const rows = (await actor.getUserXfts(owner)) as Array<[unknown, unknown]>;
    const refs = (rows || [])
      .map((r) => {
        const pair = Array.isArray(r) ? r : [r];
        const c = principalText(pair[0]) || DEXSTA_XFT_ID;
        return { contract: c, tokenId: toNum(pair[1]) };
      })
      .filter((r) => r.tokenId >= 0)
      .slice(0, Math.min(60, limit * 2));

    const hydrated = await mapPool(refs, 4, (ref) =>
      hydrateOne(ref.contract, ref.tokenId, null, identity),
    );
    return hydrated
      .filter((x): x is DexstaOwnedXft => x != null && x.xftType === 8)
      .slice(0, limit);
  } catch (e) {
    console.warn("[dexsta-xft] listOwnedMediaXfts failed", e);
    return [];
  }
}

/**
 * Owned game-asset XFTs only (type-8 inventory flagged at mint; qty 1+).
 * Follows transfers via ownerXftIndex on Dexsta.
 */
export async function listOwnedGameAssetXfts(
  ownerText: string,
  identity?: Identity | null,
  limit = 40,
): Promise<DexstaOwnedXft[]> {
  if (!ownerText || ownerText.includes("demo")) return [];

  const viaApi = await fetchViaApi(ownerText, true);
  if (viaApi) {
    return viaApi
      .map((x) => ({ ...x, gameAsset: true }))
      .slice(0, limit);
  }

  if (!isDexstaXftConfigured()) return [];

  try {
    const owner = Principal.fromText(ownerText);
    const actor = await createXftActor(identity);
    if (!actor) return [];

    if (typeof actor.getUserGameAssetXfts === "function") {
      const rows = (await actor.getUserGameAssetXfts(
        owner,
      )) as Array<[unknown, unknown]>;
      const refs = (rows || [])
        .map((r) => {
          const pair = Array.isArray(r) ? r : [r];
          const c = principalText(pair[0]) || DEXSTA_XFT_ID;
          return { contract: c, tokenId: toNum(pair[1]) };
        })
        .filter((r) => r.tokenId >= 0)
        .slice(0, limit);

      const hydrated = await mapPool(refs, 4, (ref) =>
        hydrateOne(ref.contract, ref.tokenId, true, identity),
      );
      return hydrated
        .filter((x): x is DexstaOwnedXft => x != null)
        .slice(0, limit);
    }

    // Fallback: filter media list
    const media = await listOwnedMediaXfts(ownerText, identity, 60);
    return media.filter((x) => x.gameAsset).slice(0, limit);
  } catch (e) {
    console.warn("[dexsta-xft] listOwnedGameAssetXfts failed", e);
    return [];
  }
}

export type ProfileMediaPortfolio = {
  gameAssets: DexstaOwnedXft[];
  mediaXfts: DexstaOwnedXft[];
  /** All unique media (game assets first) */
  all: DexstaOwnedXft[];
  source: "canister" | "api" | "empty";
};

/**
 * User's game-asset XFTs that nest under a Lead Label (Dexsta linkedTo).
 * Dexsta APIs: getUserGameAssetXfts(owner) + getCardLight/getXFT.linkedTo
 *   or linkedLabelOf(tokenId).
 *
 * If labelId is 0/null, returns [] (caller should skip equip logic).
 */
export async function listOwnedGameAssetsForLabel(
  ownerText: string,
  labelId: number,
  identity?: Identity | null,
  limit = 40,
): Promise<DexstaOwnedXft[]> {
  const lid = Math.floor(Number(labelId) || 0);
  if (lid <= 0) return [];
  const assets = await listOwnedGameAssetXfts(ownerText, identity, Math.max(limit, 60));
  return assets
    .filter((a) => a.linkedLabelId === lid)
    .slice(0, limit);
}

/** Combined portfolio for profile picker. */
export async function loadProfileMediaPortfolio(
  ownerText: string,
  identity?: Identity | null,
): Promise<ProfileMediaPortfolio> {
  if (!ownerText?.trim()) {
    return { gameAssets: [], mediaXfts: [], all: [], source: "empty" };
  }

  const [gameAssets, mediaXfts] = await Promise.all([
    listOwnedGameAssetXfts(ownerText, identity),
    listOwnedMediaXfts(ownerText, identity),
  ]);

  const seen = new Set<string>();
  const all: DexstaOwnedXft[] = [];
  for (const x of [...gameAssets, ...mediaXfts]) {
    const k = `${x.contract}:${x.tokenId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    // Prefer gameAsset flag if listed in game assets
    const isGame = gameAssets.some(
      (g) => g.contract === x.contract && g.tokenId === x.tokenId,
    );
    all.push(isGame ? { ...x, gameAsset: true } : x);
  }

  const source: ProfileMediaPortfolio["source"] =
    all.length > 0 || isDexstaXftConfigured() || Boolean(DEXSTA_API_URL)
      ? DEXSTA_API_URL && !isDexstaXftConfigured()
        ? "api"
        : "canister"
      : "empty";

  return {
    gameAssets: all.filter((x) => x.gameAsset),
    mediaXfts: all.filter((x) => !x.gameAsset),
    all,
    source,
  };
}

export type LabelAuthorityRole = "owner" | "operator";

export type LabelAuthorityResult = {
  ok: boolean;
  role: LabelAuthorityRole | null;
  labelId: number;
  labelName: string | null;
  ownerPrincipal: string | null;
  /** Short message for toasts / form helper */
  message: string;
};

/**
 * Arcade cabinet may only bind a Dexsta Lead Label if the creator is the
 * label's current owner or an operator on that label (`isOperator`).
 *
 * Uses:
 *  - getCardLight / getXFT → owner
 *  - isOperator(user, labelId)
 *  - getLabelTextById (display)
 */
export async function checkLabelAuthority(opts: {
  userPrincipal: string;
  labelId: number;
  identity?: Identity | null;
}): Promise<LabelAuthorityResult> {
  const labelId = Math.floor(Number(opts.labelId) || 0);
  const userText = (opts.userPrincipal || "").trim();

  if (labelId <= 0) {
    return {
      ok: true,
      role: null,
      labelId: 0,
      labelName: null,
      ownerPrincipal: null,
      message: "No Lead Label linked",
    };
  }

  if (!userText || userText.includes("demo") || userText === "anon-player") {
    return {
      ok: false,
      role: null,
      labelId,
      labelName: null,
      ownerPrincipal: null,
      message:
        "Linking a Lead Label requires a real ICP principal (not demo login). Own or operate the label on Dexsta.",
    };
  }

  if (!isDexstaXftConfigured()) {
    return {
      ok: false,
      role: null,
      labelId,
      labelName: null,
      ownerPrincipal: null,
      message:
        "Dexsta XFT canister is not configured — cannot verify Lead Label ownership.",
    };
  }

  let userP: Principal;
  try {
    userP = Principal.fromText(userText);
  } catch {
    return {
      ok: false,
      role: null,
      labelId,
      labelName: null,
      ownerPrincipal: null,
      message: "Invalid principal — cannot verify label ownership.",
    };
  }

  try {
    const actor = await createXftActor(opts.identity);
    if (!actor) {
      return {
        ok: false,
        role: null,
        labelId,
        labelName: null,
        ownerPrincipal: null,
        message: "Could not connect to Dexsta XFT canister.",
      };
    }

    const contract = Principal.fromText(DEXSTA_XFT_ID);
    let ownerText: string | null = null;
    let labelName: string | null = null;
    let exists = false;

    // Display name
    if (typeof actor.getLabelTextById === "function") {
      try {
        const opt = await actor.getLabelTextById(BigInt(labelId));
        const t = unwrapOpt<string>(opt);
        if (t) labelName = String(t);
      } catch {
        /* optional */
      }
    }

    // Owner via getCardLight (cheap) then getXFT
    if (typeof actor.getCardLight === "function") {
      try {
        const light = await actor.getCardLight(contract, BigInt(labelId));
        if (light?.exists) {
          exists = true;
          ownerText = principalText(light.owner);
          if (!labelName && light.label_name) {
            labelName = String(light.label_name);
          }
        }
      } catch {
        /* try getXFT */
      }
    }

    if (!ownerText && typeof actor.getXFT === "function") {
      try {
        const raw = await actor.getXFT(contract, BigInt(labelId));
        if (raw?.exists !== false) {
          exists = true;
          const token = unwrapOpt<{ owner?: unknown }>(raw?.token) ?? raw?.token;
          ownerText =
            principalText(raw?.owner) ||
            principalText(token && typeof token === "object" ? (token as { owner?: unknown }).owner : null) ||
            null;
        }
      } catch {
        /* */
      }
    }

    if (!exists && !ownerText) {
      // Still try isOperator — some labels may resolve operator-only
      let isOp = false;
      if (typeof actor.isOperator === "function") {
        try {
          isOp = Boolean(await actor.isOperator(userP, BigInt(labelId)));
        } catch {
          isOp = false;
        }
      }
      if (isOp) {
        return {
          ok: true,
          role: "operator",
          labelId,
          labelName,
          ownerPrincipal: null,
          message: labelName
            ? `Operator of “${labelName}” (#${labelId})`
            : `Operator of Lead Label #${labelId}`,
        };
      }
      return {
        ok: false,
        role: null,
        labelId,
        labelName,
        ownerPrincipal: null,
        message: labelName
          ? `Lead Label “${labelName}” (#${labelId}) not found or has no owner on Dexsta.`
          : `Lead Label #${labelId} not found on Dexsta.`,
      };
    }

    const isOwner =
      !!ownerText &&
      ownerText === userText;

    let isOp = false;
    if (typeof actor.isOperator === "function") {
      try {
        isOp = Boolean(await actor.isOperator(userP, BigInt(labelId)));
      } catch {
        isOp = false;
      }
    }

    if (isOwner) {
      return {
        ok: true,
        role: "owner",
        labelId,
        labelName,
        ownerPrincipal: ownerText,
        message: labelName
          ? `Owner of “${labelName}” (#${labelId})`
          : `Owner of Lead Label #${labelId}`,
      };
    }

    if (isOp) {
      return {
        ok: true,
        role: "operator",
        labelId,
        labelName,
        ownerPrincipal: ownerText,
        message: labelName
          ? `Operator of “${labelName}” (#${labelId})`
          : `Operator of Lead Label #${labelId}`,
      };
    }

    return {
      ok: false,
      role: null,
      labelId,
      labelName,
      ownerPrincipal: ownerText,
      message: labelName
        ? `You must own or operate Lead Label “${labelName}” (#${labelId}) on Dexsta to link it.`
        : `You must own or operate Lead Label #${labelId} on Dexsta to link it.`,
    };
  } catch (e) {
    console.warn("[dexsta-xft] checkLabelAuthority failed", e);
    return {
      ok: false,
      role: null,
      labelId,
      labelName: null,
      ownerPrincipal: null,
      message:
        e instanceof Error
          ? `Dexsta label check failed: ${e.message}`
          : "Dexsta label check failed.",
    };
  }
}
