# Gamerholic (new) — UI-first

Fun **web3 esports** on ICP. Chakra UI + Next.js shell before rebuilding protocol.

## Product story

- **Host-to-earn** — tournaments & game rooms pay hosts  
- **High Score Arcade** — earn when others fail your score  
- **Attribute tokens** — Power, Speed, Attack, Defense… on Dexsta XFTs  
- **XFT Battle** — Pokémon-style fighters  

## Run

```bash
npm install
npm run dev   # http://localhost:3020
```

UI kit: [/ui-kit](http://localhost:3020/ui-kit)

## Design

- Dark night arena · **volt lime** · **prize magenta** · **attribute violet**  
- Desktop content **90rem** wide  
- Mobile app chrome (tabs + Create sheet)  

| Doc | Topic |
|-----|--------|
| [`notes/design/concept.md`](notes/design/concept.md) | Product story & money loops |
| [`notes/design/high-score-arcade.md`](notes/design/high-score-arcade.md) | Arcade host, prizes, Dexsta labels, sessions |
| [`notes/design/ui-theme.md`](notes/design/ui-theme.md) | Routes & chrome |
| [`notes/design/design-system.md`](notes/design/design-system.md) | Tokens & components |
| [`notes/design/canister-supabase-realtime.md`](notes/design/canister-supabase-realtime.md) | Mirror + Realtime |
| [`supabase/README.md`](supabase/README.md) | Apply SQL (incl. arcade) |
