# ICRC-1 transfers, low balance & canister errors

**Status:** shipped (mainnet)  
**Updated:** 2026-08-04  
**Canisters:** `gh_backend` `u2in7-tiaaa-aaaab-qc2jq-cai` · ledger `ryjl3-tyaaa-aaaaa-aaaba-cai`  
**Related:** [high-score-arcade.md](./high-score-arcade.md) · [mainnet-migration.md](./mainnet-migration.md) · [canister-review.md](./canister-review.md)

---

## Problem (fixed)

Calling mainnet ICP `icrc1_transfer` with a **wrong `#Err` candid type** (e.g. `#Err: Text`, or `#TooOld : {}` empty record instead of unit `#TooOld`) **traps** the canister instead of returning a clean error. Users saw raw agent stacks on arcade insert, entry debits, etc.

---

## Motoko rules (gh_backend)

1. **TransferError** must match official ICRC-1 / `ryjl3-…`:

```motoko
type Icrc1TransferError = {
  #BadFee : { expected_fee : Nat };
  #BadBurn : { min_burn_amount : Nat };
  #InsufficientFunds : { balance : Nat };
  #TooOld;                                    // unit — NOT #TooOld : {}
  #CreatedInFuture : { ledger_time : Nat64 };
  #Duplicate : { duplicate_of : Nat };
  #TemporarilyUnavailable;
  #GenericError : { error_code : Nat; message : Text };
};
type Icrc1TransferResult = { #Ok : Nat; #Err : Icrc1TransferError };
```

2. Map errors with `icrc1TransferErrorText` → user-facing `{ ok; err }` where possible.
3. **Arcade insert** (`debitArcadePlayFeeNativeICP`) returns `{ ok : Bool; err : Text }` (not bare `Bool`).
4. Always use **native ICP ledger** via `icrc1LedgerActor()` / `icpLedgerPrincipal` (mainnet `ryjl3-…`).

### Debit reserve (fees)

| Action | Required play-sub ICP |
|--------|------------------------|
| Challenge / tournament / room entry | stake + **1×** ledger fee (0.0001) |
| Arcade insert | play fee + **2×** ledger fee (platform cut + escrow) |
| Shop merch | order total + **1×** fee |

Helpers: `requiredIcpForChallengeEntry`, `requiredIcpForTournamentEntry`, `requiredIcpForArcadeInsert` in `src/lib/ic/gamer-service.ts`.

---

## Frontend

| Module | Role |
|--------|------|
| `src/lib/ic/canister-errors.ts` | `formatCanisterError`, `safeCanisterCall`, `parseOkErr` |
| `src/lib/ic/settlement-service.ts` | All debits/payouts catch agent rejects → `{ ok, err }` |
| `src/lib/ic/gamer-service.ts` | `checkPlayIcpAfford`, `getUserPlayIcpBalance`, required-amount helpers |
| `src/components/ui/low-balance-alert.tsx` | `LowBalanceAlert` + `toastLowBalance` (warning + Open wallet) |

### Pre-check before canister

**Do not wait on ledger InsufficientFunds** when balance is known:

1. Query `getUserICPBalance` (play sub).
2. If `balance < need` → show **Low balance** UI and stop.
3. If balance unknown → allow canister path; still format traps gracefully.

Wired on: arcade insert, challenge create/accept, tournament join, settlement wrappers.

---

## Mainnet deploy (2026-08-04)

```bash
export CI=1 TERM=xterm-256color DFX_WARNING=-mainnet_plaintext_identity
dfx identity use mainnet
dfx deploy gh_backend --network ic --identity mainnet --yes
# FE with production NEXT_PUBLIC_* (park .env.local so local IDs are not baked)
npm run build:ic && dfx deploy gh_assets --network ic --identity mainnet --yes
```

Verify: `getIcpLedgerPrincipal` → `ryjl3-tyaaa-aaaaa-aaaba-cai`.

---

## Checklist for new transfer code

- [ ] Actor type uses official TransferError (unit `#TooOld`)
- [ ] Switch on `#Err` → text / `{ ok = false; err = … }` — never ignore traps
- [ ] FE: pre-check balance when amount known
- [ ] FE: `formatCanisterError` / `toastLowBalance` on failure
- [ ] IDL FE matches Motoko return type (`{ ok, err }` vs `Bool`)
