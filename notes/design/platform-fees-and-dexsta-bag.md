# Platform fees · product surfaces · Dexsta bag split

**Status:** implemented on-chain + admin Fees console (deploy required)  
**Updated:** 2026-08-04  
**Canister:** `gh_backend` · **Admin UI:** Moderator console → **Fees** (on-chain admin only)

---

## 1. Why arcade fee is in **bps** (not whole %)

Arcade play fees are often small (e.g. 0.01–0.1 ICP). Platform wants a **fractional** cut such as **1.5%**, which cannot be expressed as an integer percent without rounding to 1% or 2%.

| Unit | Meaning | Example |
|------|---------|---------|
| **1 bps** | 0.01% | 1 / 10_000 of amount |
| **100 bps** | 1% | |
| **150 bps** | **1.5%** | default arcade play cut |
| **1000 bps** | 10% | default heads-up platform rake |
| **500 bps** | 5% | default tournament platform rake |

Math on-chain: `(amount * bps) / 10000`. Cap for admin knobs: **2000 bps (20%)**.

Heads-up and tournament platform rates are also stored in **bps** so the same admin UX and precision apply (UI shows both bps and %).

---

## 2. Different fees by product surface

| Surface | Platform rate (admin-set) | Default | Host cut | Notes |
|---------|---------------------------|---------|----------|--------|
| **Heads-up (1v1)** | `headsUpPlatformFeeBps` | **1000 (10%)** | none | Pure 1v1; optional mod 2% |
| **Tournament / room** | `tournamentPlatformFeeBps` | **500 (5%)** | host up to 10% (`hostFeeBps`, host-chosen) | Host fee is **not** platform fee |
| **Arcade play** | `arcadePlatformFeeBps` | **150 (1.5%)** | n/a | Of each **paid play fee**, not pot |
| **Arcade submit** | `arcadeSubmitFeeE8s` | 0.01 ICP | n/a | Flat fee to ship cabinet for testing |
| **Vault** | fixed | 100 bps (1%) | — | Community vault on native pot settle |
| **Mod** | fixed when assigned | 200 bps (2%) | — | |

Legacy `platformFeeRate` (%) is kept in sync with `tournamentPlatformFeeBps / 100` for older claim paths.

**Host fee vs platform fee:** Hosts set `hostFeeBps` at create (capped 1000 = 10%). That is the operator cut. Platform rake is separate and admin-only.

---

## 3. Admin console (not moderator)

All fee policy setters require **`hasAdminFlag`** (on-chain admin), **not** moderator roles.

Fees tab fields:

1. Heads-up platform fee (bps)  
2. Tournament platform fee (bps)  
3. Arcade play cut (bps)  
4. Arcade submit fee (ICP)  
5. **Platform XFT id** (Dexsta)  
6. Legacy tournament % (mirrors tournament bps)  
7. Fee recipient (legacy text)

---

## 4. Platform XFT → bag gets 50% of platform fees

| Field | Meaning |
|-------|---------|
| `platformXftId` | Dexsta XFT id; **0** = disabled |
| `platformBagPrincipal` | Cached bag principal from `bag_factory.getBag(xftId, xftContract)` |

**Rule:** when `platformXftId > 0` and bag is resolved:

- **50%** of each platform fee transfer → **bag principal** (default subaccount)  
- **50%** → `platformFeePrincipal` (ops wallet)

If bag is missing, amount too small for two ledger fees, or xft id is 0 → **100%** → platform wallet.

**Dexsta IDs (mainnet, hardcoded on gh_backend):**

| Role | Canister |
|------|----------|
| XFT contract | `nj5wo-siaaa-aaaaf-qc3mq-cai` |
| Bag factory | `e6rzi-7yaaa-aaaab-qc6za-cai` |

`setPlatformXftId(caller, id)` resolves bag at set time; fails if no bag exists for that XFT.

Applies to: native pot platform legs (`payPlatform`), arcade play platform cut.

---

## 5. Deploy / ops checklist

- [ ] `dfx deploy gh_backend` (mainnet) with new policy methods  
- [ ] FE redeploy assets so Fees console shows new knobs  
- [ ] Admin: set heads-up / tournament bps if not using defaults  
- [ ] Admin: set platform XFT id once Dexsta bag exists for that token  
- [ ] Smoke: paid HU settle · tournament settle · arcade play fee with bag on/off  

---

## 6. Related

- Arcade product: [`high-score-arcade.md`](./high-score-arcade.md)  
- Dexsta partners: `dexsta/notes/design/cross-app-xft-partners.md`  
- Bag vault: `dexsta/notes/design/bag-vault.md`  
