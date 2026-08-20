# Internet Identity — stable principals & mainnet host

**Status:** live on Gamerholic (2026-08-04)  
**Updated:** 2026-08-04  
**Related:** [mainnet-migration.md](./mainnet-migration.md) · [icrc1-transfers-and-errors.md](./icrc1-transfers-and-errors.md)

---

## 1. What went wrong (incident)

Users saw **different principals** after deploys / reconnects. That looked like “redeploy changed my identity,” but **Motoko and asset upgrades never mint principals**.

### Real causes

| Cause | Effect |
|-------|--------|
| No fixed `derivationOrigin` | Same II anchor → **different** principal per hostname (`gamerholic.fun` vs `u5jll-….icp0.io` vs raw) |
| Static build baked **local** env | Agent used `http://127.0.0.1:4943` on production → “Cannot reach the IC HOST. Is dfx running?” |
| On-chain admin checked before session ready / via username | Admin link missing; **Chain admins: 0** even when `listAdmins` was correct |
| Auth session epoch wipe | One intentional logout so everyone reconnects under fixed derivation |

### Play-sub balances

Play ICP lives under **play subaccount = f(principal)**.  
A new principal → empty balance (old funds remain under the old principal).

---

## 2. Correct architecture (Gamerholic)

| Piece | Value |
|-------|--------|
| Canonical origin | `https://gamerholic.fun` |
| Login | `derivationOrigin: https://gamerholic.fun` (never `window.location.origin` on prod) |
| Alt origins file | `public/.well-known/ii-alternative-origins` lists canister `icp0.io`, `raw`, `www` |
| IC domains | `public/.well-known/ic-domains` → `gamerholic.fun` / `www.gamerholic.fun` |
| IC host (runtime) | On `gamerholic.fun` / `*.icp0.io` → **always** `https://icp0.io` |
| Backend ID (runtime) | Mainnet default `u2in7-tiaaa-aaaab-qc2jq-cai` if env wrong |
| Localhost | No derivationOrigin; local Ed25519 or local II — **dev only** |

### Code map

| Area | Path |
|------|------|
| Login / epoch wipe | `src/components/providers/session-context.tsx` |
| Host + canister IDs | `src/lib/ic/canisters.ts` (`useMainnetIc`, `getIcHost`, …) |
| “Is local?” | `src/lib/ic/local-identity.ts` (`isLocalIcNetwork`) |
| Build (park `.env.local`) | `scripts/build-ic-static.sh` |
| II well-known | `public/.well-known/ii-alternative-origins` |
| Chain admins | `gh_backend` `setAdmin` / `listAdmins` (stable `adminPrincipals` array) |

### Admin

- Flag is **principal text**, not username.
- Only on-chain admins (or recovery controller) can grant/revoke.
- UI: header **Admin** nav + account menu **Admin console** when `isAdmin` (chain **or** Supabase).
- Fees / shop need **mainnet agent** + chain admin flag (Supabase admin alone only unlocks some FE gates).

---

## 3. Ops checklist (every FE deploy)

```bash
cd gamerholic_new
npm run build:ic   # forces IC env, parks .env.local, keeps Supabase keys
# Confirm out/ has:
#   .well-known/ii-alternative-origins
#   .well-known/ic-domains
# Bundle should not force localhost as host on gamerholic.fun
dfx deploy gh_assets --network ic
```

After deploy: hard-refresh **https://gamerholic.fun**, Connect once if epoch wiped, confirm principal stable.

### Do **not**

- Open production with a build that used `.env.local` (local host/canister IDs).
- Use `window.location.origin` as derivation on mainnet.
- Treat redeploys as identity resets.

---

## 4. Sister apps (audit 2026-08-04)

| App | Derivation origin | Alt-origins | Runtime mainnet host guard | Risk |
|-----|-------------------|-------------|----------------------------|------|
| **Gamerholic** | ✅ `gamerholic.fun` | ✅ | ✅ | Low after fix |
| **Yoinx** | ✅ `yoinx.fun` | ✅ | Partial — harden `*.icp0.io` | Medium on canister URL if env wrong |
| **Betable** | ❌ missing | ❌ | ❌ default host `127.0.0.1:4943` | **High** same GH class of bug |
| **Dexsta** | ❌ missing | ❌ | ❌ bake-time only | **High** if static export uses local env |

See patches applied in each repo (same week) for parity.

---

## 5. User-facing guidance

1. Prefer the **custom domain** (e.g. gamerholic.fun), not only the raw canister URL.  
2. Same Internet Identity **passkey/account** every time.  
3. After a one-time “Connect again” (derivation / host fix), principal should **not** change on redeploy.  
4. Old principals still hold funds under their subaccounts until spent/migrated.
