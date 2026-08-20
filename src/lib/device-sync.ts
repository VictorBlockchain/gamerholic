/**
 * Gamerholic device sync (multi-II) — mirrors Betable/Afta pairing.
 * Canonical primary is used for Connect Betable/Afta storage and Esports link-back.
 */

import type { Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { createBackendActor, isCanisterConfigured } from "@/lib/ic/canisters";

export type LinkedDevices = {
  primary: string;
  devices: string[];
  isPrimary: boolean;
};

export type DeviceSyncCodeResult = {
  success: boolean;
  code: string;
  expiresAt: number;
  message: string;
};

export type ClaimDeviceResult = {
  success: boolean;
  primary: string;
  message: string;
};

/** Resolve GH primary for session principal (falls back to session if not linked). */
export async function getCanonicalGhPrincipal(
  sessionPrincipal: string,
  identity?: Identity | null,
): Promise<string> {
  const p = (sessionPrincipal || "").trim();
  if (!p || p === "2vxsx-fae" || !isCanisterConfigured()) return p;
  try {
    const actor = await createBackendActor(identity);
    if (!actor || typeof (actor as any).get_canonical_principal !== "function") {
      return p;
    }
    const out = await (actor as any).get_canonical_principal(
      Principal.fromText(p),
    );
    const text =
      out && typeof out.toText === "function"
        ? out.toText()
        : String(out || p);
    return text && text !== "2vxsx-fae" ? text : p;
  } catch {
    return p;
  }
}

export async function createDeviceSyncCode(
  identity?: Identity | null,
): Promise<DeviceSyncCodeResult> {
  const actor = await createBackendActor(identity);
  if (!actor || typeof (actor as any).create_device_sync_code !== "function") {
    return {
      success: false,
      code: "",
      expiresAt: 0,
      message: "Device sync not available on this backend",
    };
  }
  const r = await (actor as any).create_device_sync_code();
  return {
    success: Boolean(r?.success),
    code: String(r?.code || ""),
    expiresAt: Number(r?.expires_at ?? 0),
    message: String(r?.message || ""),
  };
}

export async function claimDeviceSyncCode(
  code: string,
  identity?: Identity | null,
): Promise<ClaimDeviceResult> {
  const actor = await createBackendActor(identity);
  if (!actor || typeof (actor as any).claim_device_sync_code !== "function") {
    return {
      success: false,
      primary: "",
      message: "Device sync not available on this backend",
    };
  }
  const r = await (actor as any).claim_device_sync_code(code.trim());
  if (r?.success) {
    try {
      window.dispatchEvent(new CustomEvent("gh:device-sync-changed"));
    } catch {
      /* */
    }
  }
  return {
    success: Boolean(r?.success),
    primary: String(r?.primary || ""),
    message: String(r?.message || ""),
  };
}

export async function listLinkedDevices(
  identity?: Identity | null,
): Promise<LinkedDevices | null> {
  const actor = await createBackendActor(identity);
  if (!actor || typeof (actor as any).list_linked_devices !== "function") {
    return null;
  }
  try {
    const r = await (actor as any).list_linked_devices();
    return {
      primary: String(r?.primary || ""),
      devices: Array.isArray(r?.devices)
        ? r.devices.map((d: unknown) => String(d))
        : [],
      isPrimary: Boolean(r?.is_primary),
    };
  } catch {
    return null;
  }
}

export async function unlinkDevice(
  otherPrincipal: string,
  identity?: Identity | null,
): Promise<{ success: boolean; message: string }> {
  const actor = await createBackendActor(identity);
  if (!actor || typeof (actor as any).unlink_device !== "function") {
    return { success: false, message: "Device sync not available" };
  }
  const r = await (actor as any).unlink_device(
    Principal.fromText(otherPrincipal.trim()),
  );
  if (r?.success) {
    try {
      window.dispatchEvent(new CustomEvent("gh:device-sync-changed"));
    } catch {
      /* */
    }
  }
  return {
    success: Boolean(r?.success),
    message: String(r?.message || ""),
  };
}

export async function getOwnershipPrincipals(
  identity?: Identity | null,
): Promise<string[]> {
  const actor = await createBackendActor(identity);
  if (!actor || typeof (actor as any).get_ownership_principals !== "function") {
    return [];
  }
  try {
    const list = await (actor as any).get_ownership_principals();
    return Array.isArray(list) ? list.map((x: unknown) => String(x)) : [];
  } catch {
    return [];
  }
}
