/**
 * Copy-paste prompt for creators (recommend Grok) — Phaser 3 only, CSS + JS.
 * Full HTML documents are rejected: they conflict with the Gamerholic app shell.
 */

import { PHASER_ENGINE } from "./engine";

export const GAMERHOLIC_ARCADE_AI_PROMPT = `You are building a Gamerholic High Score Arcade mini-game.

═══════════════════════════════════════
CRITICAL: NO FULL HTML DOCUMENTS
═══════════════════════════════════════

Do NOT output <!DOCTYPE>, <html>, <head>, <body>, or a complete page.
Gamerholic already hosts a sandboxed shell. Full HTML collides with the app.

You only output TWO artifacts:

1) CSS (optional) — styles only, no <style> wrapper required.
   Prefer selectors under #gh-arcade-root { ... }

2) gameCode (required) — JavaScript only that registers:

window.GamerholicArcadeGame = {
  boot: function (Phaser, bridge, parentEl) {
    // Create ONE Phaser.Game mounted on parentEl
    // Use bridge for start / stop / score / assets / host timer
    // return the Phaser.Game instance
  }
};

═══════════════════════════════════════
STANDARD ENGINE: ${PHASER_ENGINE.name} ${PHASER_ENGINE.version}
═══════════════════════════════════════

${PHASER_ENGINE.why}

- Host loads Phaser from CDN (${PHASER_ENGINE.cdn}).
- Use the Phaser global passed into boot(Phaser, bridge, parentEl).
- Phaser.Scale.RESIZE (or FIT) for mobile full-bleed.
- Touch: activePointers >= 2, generous hit radii (~+14px).
- Leave top-left ~88px free — parent draws SCORE + TIME overlay.
- Docs: ${PHASER_ENGINE.docs}

Do NOT invent another engine unless asked.

═══════════════════════════════════════
HOST TIMER (DO NOT BUILD YOUR OWN COUNTDOWN)
═══════════════════════════════════════

The run length and end time are owned by Gamerholic (Supabase server clock → UI).

- Do NOT use a fixed Phaser timer / setTimeout to end the match.
- Do NOT hardcode "180 seconds" as the authority.
- Host sends:
  • gamerholic:init  → playTimeSec, remainingSec (info only)
  • gamerholic:start → remainingSec (begin accepting input / scoring)
  • gamerholic:tick  → remainingSec each ~250ms (optional UI only)
  • gamerholic:stop  → host ends run (timer hit 0, leave page, manual end)

When remaining hits 0 the HOST auto-finalizes and will send stop.
You must still:
  bridge.on("stop", function () { /* freeze input */ bridge.end(currentScore); });
  and keep calling bridge.score(currentScore, false) while playing so the host has a last value.

═══════════════════════════════════════
BRIDGE API (start / stop / score / assets)
═══════════════════════════════════════

// Listen
bridge.on("init", function (msg) {
  // msg.sessionId, msg.gameId, msg.paid, msg.playTimeSec, msg.remainingSec
  // msg.scoresCount (true only if ranked/paid)
  // msg.assets[]  — equipped Dexsta game assets (may be [])
  // msg.linkedLabelId — Lead Label id (0 = no label / no assets)
  // msg.seed — optional RNG seed from host
  applyAssets(msg.assets || []);
  // WAIT for start — do not score yet
});

bridge.on("start", function (msg) {
  // msg.remainingSec — host clock
  running = true;
  // begin accepting input
});

bridge.on("tick", function (msg) {
  // msg.remainingSec — cosmetic only; host ends at 0
});

bridge.on("stop", function (msg) {
  // Host ended (timer 0 / unload / manual). ALWAYS finalize score.
  running = false;
  bridge.end(score); // or bridge.score(score, true)
});

bridge.on("assets", function (msg) {
  applyAssets(msg.assets || []);
});

// Report
bridge.ready();                 // optional after boot
bridge.score(n, false);         // continuous checkpoints (host throttles)
bridge.end(n);                  // final score when you die / finish / on stop
bridge.requestAssets();         // ask host to re-send assets

Rules:
- FREE: paid === false → practice; host will not board the score.
- RANKED: paid === true → official board + escrow prizes.
- Always honor stop; keep reporting score so a crash still has a last value.
- Never invent your own "session over" from an internal timer.

═══════════════════════════════════════
KEYBOARD + TOUCH CONTROLS (REQUIRED)
═══════════════════════════════════════

The game runs inside a sandboxed iframe. Phaser's
  scene.input.keyboard.createCursorKeys()
does NOT reliably receive OS keyboard events (parent page keeps focus).

ALWAYS use the host bridge keyboard API (parent forwards keys):

  bridge.keyDown("left")   // ← or A
  bridge.keyDown("right")  // → or D
  bridge.keyDown("up")     // ↑ or W   (aliases: "thrust", "jump")
  bridge.keyDown("down")   // ↓ or S
  bridge.keyDown("fire")   // Space     (aliases: "space", "shoot", "action")

  // or read the live map:
  bridge.keys.left / .right / .up / .down / .fire / .space / .w / .a / .s / .d

REQUIRED pattern in update() while running:

  var left  = bridge.keyDown("left");
  var right = bridge.keyDown("right");
  var up    = bridge.keyDown("up");    // thrust / jump
  var fire  = bridge.keyDown("fire");  // shoot

  // ALSO OR with on-screen virtual buttons (mobile):
  // left = left || controls.left;  etc.

DO NOT rely only on:
  scene.cursors.left.isDown
  scene.wasd.W.isDown
(Those may work after host rebinds, but bridge.keyDown is the source of truth.)

Also REQUIRED for mobile:
- Large on-screen touch controls (buttons / joystick) with hit areas ≥44px
- Map the same actions as keyboard (left/right/up/fire)
- pointer events on buttons set a controls{} map; combine with bridge.keyDown

Example (combine keyboard + touch):

  function inputLeft() {
    return bridge.keyDown("left") || !!controls.left;
  }
  function inputFire() {
    return bridge.keyDown("fire") || !!controls.fire;
  }

  // in update:
  if (inputLeft()) { /* rotate / move left */ }
  if (inputFire() && canShoot) { fireBullet(); }

Keyboard map the host sends:
  Arrows + WASD + Space  (page scroll is blocked while a run is active)

═══════════════════════════════════════
DEXSTA GAME-ASSET XFTs (label-linked)
═══════════════════════════════════════

Host resolves assets BEFORE start (you do not call Dexsta from the iframe).

Dexsta canister APIs the host uses (confirmed on Dexsta XFT canister):
  • getUserGameAssetXfts(owner) → [(contract, tokenId)]
  • getXFT / getCardLight → linked_to / settings.linkedTo + gameAsset
  • linkedLabelOf(tokenId) → ?Nat   // parent Lead Label id

Host algorithm:
  1) If cabinet has NO linked Lead Label (linkedLabelId == 0) → assets = [] (skip).
  2) Else load player's game assets via getUserGameAssetXfts.
  3) Keep only assets where linkedTo / linkedLabelOf == cabinet.linkedLabelId.
  4) Inject as msg.assets on init (and on bridge.requestAssets).

Publishing a cabinet WITH a linkedLabelId requires the creator to be the
Dexsta Lead Label owner or operator (XFT isOperator / owner check).

msg.assets[] item:
{
  tokenId, wrapsTokenId?, label, role,
  bagPowerTokens, effectivePower, quantity, linkedLabelId?
}

Design rules:
- Limited print #45 "Hammer" may be held by many players — baseline power.
- #99 may WRAP #45 with bagPowerTokens:1000 → higher effectivePower (stronger).
- If assets is empty, run with default stats (no crash).
- Optional accepted ids/roles on the cabinet are hints; host already filtered by label.

Example:
function weaponPower(assets) {
  var w = (assets || []).find(function (a) { return a.role === "weapon"; });
  if (!w) return 10;
  return Math.max(10, Math.floor(w.effectivePower || 10));
}

═══════════════════════════════════════
MOBILE + INPUT
═══════════════════════════════════════

- Full viewport parentEl; Scale.RESIZE
- touch-action handled by host
- Top-left safe zone for host SCORE/TIME
- Portrait + landscape
- ALWAYS ship on-screen controls + bridge.keyDown (see KEYBOARD section)
- Do NOT set canvas { width/height: 100% !important } — blanks Phaser

═══════════════════════════════════════
OUTPUT FORMAT (strict)
═══════════════════════════════════════

Return exactly:

---CSS---
/* optional css under #gh-arcade-root — no canvas width/height !important */
---GAMECODE---
window.GamerholicArcadeGame = {
  boot: function (Phaser, bridge, parentEl) {
    var score = 0, running = false, assets = [];
    var controls = { left: false, right: false, up: false, fire: false };
    // virtual buttons set controls.* on pointerdown/up
    // update: use bridge.keyDown("left") || controls.left  (etc.)
    // listen init/start/tick/stop/assets — NO local end timer
    // on stop / death: bridge.end(score)
    // while running: bridge.score(score, false) on milestones
    return new Phaser.Game({ /* ... */ });
  }
};
---END---

Genre: clear 60–180s arcade loop. Score is a rising integer.
Author with Grok using this prompt, then paste CSS + GAMECODE into
Gamerholic → Arcade → Add Game. Set Lead Label id if the title uses game assets.
`;

export const GAME_ASSET_INTEGRATION_BLURB = `Game assets are Dexsta type-8 media XFTs with game_asset:true (image/audio, qty 1+).

Dexsta (confirmed):
• getUserGameAssetXfts(owner) — inventory of game assets
• getXFT / getCardLight.linked_to or linkedLabelOf(id) — parent Lead Label

Gamerholic host flow:
1) Cabinet optional linkedLabelId (Lead Label).
2) If linkedLabelId is 0 → skip assets (empty array to the game).
3) Else: get user's game assets, keep those linked to that label, inject via bridge init/assets.

Wraps: #99 wrapping #45 with bag Power tokens → higher effectivePower — treat as stronger.
Engine: Phaser 3 host only — CSS + gameCode, never full HTML.
Timer: host-provided (tick/stop); game must not end itself on a static timer.
Input: use bridge.keyDown("left"|"right"|"up"|"down"|"fire") + on-screen touch controls.
Do not rely only on Phaser createCursorKeys() inside the iframe.`;
