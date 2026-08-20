# Canister review — improvements & team payouts

**Updated:** 2026-08-04  
**Scope:** `canisters/backend/main.mo`, `canisters/media/media.mo`  
**Money / ledger candid:** [icrc1-transfers-and-errors.md](./icrc1-transfers-and-errors.md)

---

## Team tournament payouts (implemented)

When `tournament.teamEntry = true`:

1. Host fee = `pot * hostFeeBps / 10000` → host  
2. Platform rake on remainder → treasury path  
3. **Team prize pool** split by each member’s **win-split bps** (set on invite / `setTeamWinSplits`; must total **10000**)

| Method | Role |
|--------|------|
| `inviteToTeamEx(..., winSplitBps)` | Offer % of team prize when inviting |
| `setTeamWinSplits` | Captain sets full allocation (must sum 100%) |
| `getTeamWinSplits` | Query roster splits |
| `previewTeamTournamentClaim` | FE claim form preview |
| `claimTournamentTeam` | Execute split payouts |
| `claimTournament` | Solo/FFA only (rejects `teamEntry`) |

FE: `ClaimPayoutPanel` on tournament detail (host) explains the flow.

---

## Suggested improvements (priority)

### High

1. **Stable memory / upgrades**  
   Most maps are `transient` — state is wiped on upgrade. Move critical maps to `stable` vars + pre/postupgrade or use Motoko stable regions / libraries.

2. **Caller auth**  
   Many methods take `Address` as an argument instead of `msg.caller`. Prefer `shared ({ caller })` and derive identity from the principal so clients cannot spoof addresses.

3. **Status enum consistency**  
   Challenge status Nats are overloaded (4 = settled *and* used as cancel in one auto-resolve path). Use a variant type:
   ```motoko
   type ChallengeStatus = { #Open; #Live; #ScorePending; #Settled; #Disputed; #Cancelled };
   ```

4. **Time units**  
   Mix of seconds and nanoseconds (`expiresAt`, `scheduledAt`). Standardize on `Time.now()` nanoseconds everywhere and document it.

5. **Entry fee on create**  
   Old `createHeadsUpChallenge` zeroed `entryFee`; `createChallengeEx` now sets e8s correctly — audit all call sites still using the legacy create.

### Medium

6. **Idempotent claims**  
   `claimTournamentTeam` checks `settlement.claimed`; ensure ledger transfers are also idempotent (memo + transfer ledger id) so retries don’t double-pay.

7. **Team roster vs participants**  
   Team-entry tournaments still register *addresses* as participants. Link `tournamentParticipants` entries to `TeamId` (or store captain → team map) so bracket winners map cleanly to teams.

8. **Split rebalancing**  
   Auto-reducing captain on invite is good UX; also expose a UI for `setTeamWinSplits` so captains can rebalance without re-inviting.

9. **HTTP outcalls → Supabase**  
   After claim / score / cancel, optional outcall to `upsert_gh_*` so FE Realtime doesn’t depend solely on the browser mirror path (matches dexsta bag webhook pattern).

10. **Error returns**  
    Prefer `{ #ok; #err : Text }` over bare `Bool` so the UI can surface “splits not 100%” vs “not host” without guessing.  
    **Shipped (2026-08):** arcade debit, shop merch, withdraw, and distribute payouts return structured `{ ok, err }`. Challenge/tournament entry debits still `Bool` — FE pre-checks balance via `checkPlayIcpAfford` and maps traps with `formatCanisterError`.

### Lower / hygiene

11. **Monolithic `main.mo` (~8k lines)** — split into modules: `Challenges`, `Tournaments`, `Teams`, `Treasury`, `Moderation`.  
12. **Dead / duplicate settlement helpers** (`computeSettlement` vs older multi-field Settlement in IDL) — keep one schema.  
13. **Tests** — port `backend/tests/*` into this repo and cover team claim math + cancel/dispute.  
14. **Cycles budgeting** — batch auto-resolve and prize distribution can be cycle-heavy; gate with timers / admin.  
15. **Media canister** — dispute *video blobs* still separate from `disputeVideo` URL string; decide URL-only vs upload to `gh_media`.

---

## Security checklist (before mainnet)

- [ ] No client-supplied `Address` trusted without matching `caller`  
- [ ] Claim only once; settlement marked claimed before external transfer  
- [ ] Team splits validated = 10000 at claim  
- [ ] Betable schedule ≥ 1h enforced (already on open betable)  
- [ ] Rate-limit create/join against spam  
- [x] Ledger fee & balance checks before every transfer (Motoko + FE pre-check)  
- [x] ICRC-1 TransferError candid matches mainnet ledger (no `#Err: Text` / empty `#TooOld`) 
