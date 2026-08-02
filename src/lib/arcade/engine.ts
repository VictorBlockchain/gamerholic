/**
 * Gamerholic High Score Arcade — standardized game engine.
 *
 * Creators do NOT submit full HTML documents (that collides with the app shell).
 * They only submit:
 *   - css: optional styles scoped under #gh-arcade-root
 *   - gameCode: JS that registers window.GamerholicArcadeGame
 *
 * Engine: Phaser 3 (recommended for AI + mobile 2D arcade).
 * Host injects Phaser + bridge into a sandboxed iframe shell we control.
 */

/** Pinned Phaser 3 build loaded by the host shell (CDN). */
export const PHASER_ENGINE = {
  id: "phaser3" as const,
  name: "Phaser 3",
  version: "3.80.1",
  /** Why this engine for AI-created arcade titles */
  why: "Industry-standard 2D HTML5 engine — scenes, mobile Scale Manager, touch input, huge AI training data. One host-provided runtime; games ship CSS + JS only.",
  cdn: "https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js",
  docs: "https://phaser.io/learn",
};

export type ArcadeEngineId = typeof PHASER_ENGINE.id;

/**
 * Normalize pasted gameCode / CSS (markdown fences, section markers, smart quotes).
 */
export function normalizeArcadePaste(raw: string, kind: "js" | "css" = "js"): string {
  let s = (raw || "").replace(/^\uFEFF/, "").trim();
  // Markdown fences
  s = s.replace(/^```(?:javascript|js|css)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  // Section markers from AI / chat paste
  s = s.replace(/^---\s*(?:GAME\s*CODE|GAMECODE|JS|JAVASCRIPT)\s*---\s*/i, "");
  s = s.replace(/^---\s*CSS\s*---\s*/i, "");
  s = s.replace(/\s*---\s*END\s*---\s*$/i, "");
  // Smart quotes → straight (common from chat/docs)
  s = s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  // If user pasted whole bundle into gameCode, try to split
  if (kind === "js") {
    const cssSplit = s.match(
      /^[\s\S]*?---\s*CSS\s*---\s*([\s\S]*?)---\s*(?:GAME\s*CODE|GAMECODE)\s*---\s*([\s\S]*)$/i,
    );
    if (cssSplit) {
      s = cssSplit[2].trim();
    } else {
      // Bundle without markers: CSS block then window.Gamerholic…
      const winIdx = s.search(/window\s*\.\s*GamerholicArcadeGame/);
      if (winIdx > 0 && s.trimStart().startsWith("#")) {
        s = s.slice(winIdx);
      }
    }
  }
  return s.trim();
}

/**
 * Build the controlled host document for an iframe.
 * Game code is JSON-encoded + eval'd so `</script>` / paste noise cannot break HTML.
 */
export function buildPhaserHostDocument(opts: {
  title: string;
  css: string;
  gameCode: string;
}): string {
  const title = escapeHtml(opts.title || "Arcade");
  const css = sanitizeStyle(normalizeArcadePaste(opts.css || "", "css"));
  const rawCode =
    softPatchKeyboardReads(
      normalizeArcadePaste(opts.gameCode || "", "js") || FALLBACK_GAME_JS,
    );
  // Encode so the HTML parser never interprets game source
  const encodedGame = JSON.stringify(encodeURIComponent(rawCode));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<title>${title}</title>
<style>
  html,body{margin:0;width:100%;height:100%;height:100dvh;overflow:hidden;background:#070612;touch-action:none;overscroll-behavior:none;-webkit-user-select:none;user-select:none}
  #gh-arcade-root{position:fixed;inset:0;width:100%;height:100%;min-width:1px;min-height:1px;overflow:hidden}
  #gh-arcade-root canvas{display:block;touch-action:none;max-width:100%;max-height:100%}
  #gh-boot-error{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:#070612;color:#ff8a9a;font:14px/1.55 system-ui,sans-serif;z-index:9999;text-align:center;white-space:pre-wrap;word-break:break-word}
  .gh-safe-top-left{pointer-events:none}
</style>
<style id="gh-game-css">
/* Creator CSS — scope under #gh-arcade-root when possible */
${css}
</style>
</head>
<body>
<div id="gh-arcade-root"></div>
<script src="${PHASER_ENGINE.cdn}"></script>
<script>
(function(){
  "use strict";
  var listeners = { init: [], start: [], tick: [], stop: [], assets: [] };
  function emit(ev, data) {
    (listeners[ev] || []).forEach(function(fn){ try { fn(data); } catch(e) { console.error(e); } });
  }
  var lastAssets = [];
  var lastLinkedLabelId = 0;
  var lastRemaining = 0;
  var readySent = false;
  window.__ghGameCodeError = null;

  function postParent(msg) {
    try { parent.postMessage(msg, "*"); } catch (e) {}
  }

  function showError(text) {
    var el = document.getElementById("gh-boot-error");
    if (!el) {
      el = document.createElement("div");
      el.id = "gh-boot-error";
      document.body.appendChild(el);
    }
    el.textContent = text;
    postParent({ type: "gamerholic:error", message: String(text || "boot error") });
  }

  /**
   * Host-owned keyboard state.
   * Sandboxed iframes rarely receive real keyboard focus from the parent page,
   * so Phaser createCursorKeys() alone usually does NOT work. Parent forwards
   * keys → we set bridge.keys → games should read bridge.keyDown("left") etc.
   * We also rebind Phaser Key.isDown getters to this map so older games work.
   */
  var keyState = {
    left: false, right: false, up: false, down: false,
    fire: false, space: false,
    w: false, a: false, s: false, d: false
  };

  /** code → bridge key names (aliases share state for arcade UX) */
  var CODE_TO_BRIDGE = {
    ArrowLeft: ["left", "a"], KeyA: ["left", "a"],
    ArrowRight: ["right", "d"], KeyD: ["right", "d"],
    ArrowUp: ["up", "w"], KeyW: ["up", "w"],
    ArrowDown: ["down", "s"], KeyS: ["down", "s"],
    Space: ["space", "fire"]
  };
  var CODE_TO_KEYCODE = {
    ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Space: 32,
    KeyA: 65, KeyD: 68, KeyS: 83, KeyW: 87
  };
  var KEYCODE_TO_NAMES = {
    37: ["left", "a"], 38: ["up", "w"], 39: ["right", "d"], 40: ["down", "s"],
    32: ["space", "fire"], 65: ["left", "a"], 68: ["right", "d"],
    83: ["down", "s"], 87: ["up", "w"]
  };

  function setBridgeKeysFromCode(code, down) {
    var names = CODE_TO_BRIDGE[code];
    if (!names) return;
    for (var i = 0; i < names.length; i++) keyState[names[i]] = !!down;
  }

  /** Make Phaser Key.isDown read host bridge.keys (fixes sandboxed keyboard). */
  function bindPhaserKeyToBridge(key, names) {
    if (!key || key.__ghBridgeBound) return;
    key.__ghBridgeBound = true;
    var n = names || KEYCODE_TO_NAMES[key.keyCode] || [];
    Object.defineProperty(key, "isDown", {
      configurable: true,
      enumerable: true,
      get: function() {
        for (var i = 0; i < n.length; i++) {
          if (keyState[n[i]]) return true;
        }
        return false;
      },
      set: function() { /* host owns key state */ }
    });
    Object.defineProperty(key, "isUp", {
      configurable: true,
      enumerable: true,
      get: function() { return !this.isDown; },
      set: function() {}
    });
  }

  function wireAllPhaserKeys() {
    try {
      var g = window.__ghGame;
      var kb = g && g.input && g.input.keyboard;
      if (!kb || typeof kb.addKey !== "function") return;
      var codes = [37, 38, 39, 40, 32, 65, 68, 83, 87];
      for (var i = 0; i < codes.length; i++) {
        try {
          var k = kb.addKey(codes[i]);
          bindPhaserKeyToBridge(k, KEYCODE_TO_NAMES[codes[i]]);
        } catch (e1) {}
      }
      if (kb.keys && kb.keys.length) {
        for (var j = 0; j < kb.keys.length; j++) {
          var kk = kb.keys[j];
          if (kk && kk.keyCode && KEYCODE_TO_NAMES[kk.keyCode]) {
            bindPhaserKeyToBridge(kk, KEYCODE_TO_NAMES[kk.keyCode]);
          }
        }
      }
    } catch (e) {}
  }

  window.GamerholicBridge = {
    engine: "phaser3",
    hostOwnsTimer: true,
    /** Live key map — prefer bridge.keyDown(name) in game code */
    keys: keyState,
    /**
     * @param {string} name left|right|up|down|fire|space|w|a|s|d
     * @returns {boolean}
     */
    keyDown: function(name) {
      name = String(name || "").toLowerCase();
      if (name === "shoot" || name === "action" || name === "bomb") name = "fire";
      if (name === "thrust" || name === "jump") name = "up";
      return !!keyState[name];
    },
    on: function(ev, fn) {
      if (listeners[ev]) listeners[ev].push(fn);
      return function off() {
        listeners[ev] = (listeners[ev] || []).filter(function(f){ return f !== fn; });
      };
    },
    ready: function() {
      // Always post so parent checklist can recover after remount / missed first message
      readySent = true;
      postParent({ type: "gamerholic:ready" });
    },
    score: function(score, final) {
      postParent({
        type: final ? "gamerholic:end" : "gamerholic:score",
        score: Math.floor(Number(score) || 0),
        final: !!final
      });
    },
    end: function(score) {
      postParent({
        type: "gamerholic:end",
        score: Math.floor(Number(score) || 0)
      });
    },
    requestAssets: function() {
      postParent({ type: "gamerholic:requestAssets" });
    },
    getAssets: function() { return lastAssets.slice(); },
    getLinkedLabelId: function() { return lastLinkedLabelId; },
    getRemainingSec: function() { return lastRemaining; }
  };

  /** Keys that must never scroll the host (or parent when forwarded). */
  var GAME_KEY_CODES = {
    ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, Space: 1,
    KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1
  };

  function isGameKey(e) {
    return !!(e && (GAME_KEY_CODES[e.code] || e.key === " " ||
      e.key === "ArrowUp" || e.key === "ArrowDown" ||
      e.key === "ArrowLeft" || e.key === "ArrowRight" ||
      e.key === "w" || e.key === "a" || e.key === "s" || e.key === "d" ||
      e.key === "W" || e.key === "A" || e.key === "S" || e.key === "D"));
  }

  // Native keys inside iframe (if focus works) + block scroll
  window.addEventListener("keydown", function(e) {
    if (!isGameKey(e)) return;
    e.preventDefault();
    setBridgeKeysFromCode(e.code, true);
    wireAllPhaserKeys();
  }, { capture: true, passive: false });
  window.addEventListener("keyup", function(e) {
    if (!isGameKey(e)) return;
    e.preventDefault();
    setBridgeKeysFromCode(e.code, false);
  }, { capture: true, passive: false });

  /** Parent-forwarded keys (primary path when iframe lacks focus). */
  function injectKey(m) {
    try {
      var down = m.event !== "keyup";
      setBridgeKeysFromCode(m.code, down);
      wireAllPhaserKeys();
    } catch (err) {
      console.warn("key inject failed", err);
    }
  }

  function focusGame() {
    try { window.focus(); } catch (e) {}
    try {
      var root = document.getElementById("gh-arcade-root");
      if (root) {
        if (!root.hasAttribute("tabindex")) root.setAttribute("tabindex", "0");
        root.focus({ preventScroll: true });
      }
      var canvas = root && root.querySelector("canvas");
      if (canvas) {
        if (!canvas.hasAttribute("tabindex")) canvas.setAttribute("tabindex", "0");
        canvas.focus({ preventScroll: true });
      }
    } catch (e2) {}
  }

  window.addEventListener("message", function(ev) {
    var m = ev.data;
    if (!m || typeof m.type !== "string" || m.type.indexOf("gamerholic:") !== 0) return;
    var t = m.type.replace("gamerholic:", "");
    if (t === "init") {
      lastAssets = Array.isArray(m.assets) ? m.assets : [];
      lastLinkedLabelId = Number(m.linkedLabelId) || 0;
      lastRemaining = Number(m.remainingSec) || 0;
      emit("init", m);
      focusGame();
    } else if (t === "start") {
      lastRemaining = Number(m.remainingSec) || lastRemaining;
      // clear stuck keys between runs
      for (var kn in keyState) if (Object.prototype.hasOwnProperty.call(keyState, kn)) keyState[kn] = false;
      emit("start", m);
      focusGame();
      wireAllPhaserKeys();
      setTimeout(wireAllPhaserKeys, 100);
      setTimeout(wireAllPhaserKeys, 400);
    } else if (t === "tick") {
      lastRemaining = Number(m.remainingSec) || 0;
      emit("tick", m);
      // keep Phaser keys wired if game recreated input mid-run
      if ((lastRemaining | 0) % 5 === 0) wireAllPhaserKeys();
    } else if (t === "stop") {
      for (var kn2 in keyState) if (Object.prototype.hasOwnProperty.call(keyState, kn2)) keyState[kn2] = false;
      emit("stop", m);
    } else if (t === "assets") {
      lastAssets = Array.isArray(m.assets) ? m.assets : [];
      if (m.linkedLabelId != null) lastLinkedLabelId = Number(m.linkedLabelId) || 0;
      emit("assets", m);
    } else if (t === "key") {
      injectKey(m);
    } else if (t === "focus") {
      focusGame();
      wireAllPhaserKeys();
    } else if (t === "ping" || t === "requestReady") {
      // Parent re-syncs checklist after missing the first ready post
      if (readySent) {
        postParent({ type: "gamerholic:ready" });
      }
    }
  });

  // Click stage to focus for keyboard
  document.addEventListener("pointerdown", function() {
    focusGame();
    wireAllPhaserKeys();
  }, true);

  window.__ghBootGame = function boot() {
    var parentEl = document.getElementById("gh-arcade-root");
    if (!parentEl) return;
    if (parentEl.clientWidth < 2 || parentEl.clientHeight < 2) {
      parentEl.style.width = "100%";
      parentEl.style.height = "100%";
    }
    if (typeof Phaser === "undefined") {
      showError("Phaser failed to load from CDN. Check network / adblock, then Reload.");
      return;
    }
    if (window.__ghGameCodeError) {
      showError("Game code error:\\n" + window.__ghGameCodeError + "\\n\\nFix syntax in the Game code field (JS only — not CSS).");
      window.GamerholicBridge.ready();
      return;
    }
    var mod = window.GamerholicArcadeGame;
    if (!mod || typeof mod.boot !== "function") {
      var hint =
        "Game must set window.GamerholicArcadeGame = { boot: function(Phaser, bridge, parentEl){...} }";
      if (window.__ghGameCodeError) {
        hint += "\\n\\nCode error: " + window.__ghGameCodeError;
      } else {
        hint +=
          "\\n\\nPaste only JavaScript in Game code (starts with window.GamerholicArcadeGame). CSS goes in the CSS field.";
      }
      showError(hint);
      window.GamerholicBridge.ready();
      return;
    }
    try {
      window.__ghGame = mod.boot(Phaser, window.GamerholicBridge, parentEl);
      setTimeout(function() {
        try {
          var g = window.__ghGame;
          if (g && g.scale && typeof g.scale.refresh === "function") g.scale.refresh();
        } catch (e) {}
        wireAllPhaserKeys();
      }, 50);
      setTimeout(function() {
        try {
          var g2 = window.__ghGame;
          if (g2 && g2.scale && typeof g2.scale.refresh === "function") g2.scale.refresh();
        } catch (e) {}
        wireAllPhaserKeys();
      }, 250);
      setTimeout(wireAllPhaserKeys, 800);
    } catch (err) {
      console.error(err);
      showError("Game boot error: " + String(err && err.message || err));
    }
    window.GamerholicBridge.ready();
  };
})();
</script>
<script>
(function(){
  "use strict";
  // Decode + run creator JS safely (never raw-inject into HTML)
  try {
    var src = decodeURIComponent(${encodedGame});
    // Indirect eval — global scope so window.GamerholicArcadeGame is set
    (0, eval)(src);
  } catch (err) {
    window.__ghGameCodeError = String(err && err.message || err);
    console.error("Gamerholic gameCode eval failed:", err);
  }
})();
</script>
<script>
(function(){
  "use strict";
  function run() {
    if (typeof window.__ghBootGame === "function") window.__ghBootGame();
  }
  if (document.readyState === "complete") {
    requestAnimationFrame(function(){ requestAnimationFrame(run); });
  } else {
    window.addEventListener("load", function(){
      requestAnimationFrame(function(){ requestAnimationFrame(run); });
    });
  }
})();
</script>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Strip </style> breakouts and canvas width/height rules that break Phaser Scale Manager.
 */
function sanitizeStyle(css: string) {
  return css
    .replace(/<\/style/gi, "<\\/style")
    .replace(
      /(#gh-arcade-root\s+canvas\s*\{)([^}]*)(\})/gi,
      (_m, open: string, body: string, close: string) => {
        const cleaned = body
          .replace(/width\s*:\s*[^;]+;?/gi, "")
          .replace(/height\s*:\s*[^;]+;?/gi, "");
        return `${open}${cleaned}${close}`;
      },
    );
}

/**
 * Legacy games often use Phaser createCursorKeys / wasd.isDown only.
 * OR in bridge.keyDown so parent-forwarded keys work without a full rewrite.
 */
function softPatchKeyboardReads(code: string): string {
  if (!code || code.includes("__ghKbPatched")) return code;
  let out = code;
  // scene.cursors.left.isDown  →  (… || bridge.keyDown("left"))
  const cursorMap: Array<[RegExp, string]> = [
    [/(\w+)\.cursors\.left\.isDown/g, '($1.cursors.left.isDown||bridge.keyDown("left"))'],
    [/(\w+)\.cursors\.right\.isDown/g, '($1.cursors.right.isDown||bridge.keyDown("right"))'],
    [/(\w+)\.cursors\.up\.isDown/g, '($1.cursors.up.isDown||bridge.keyDown("up"))'],
    [/(\w+)\.cursors\.down\.isDown/g, '($1.cursors.down.isDown||bridge.keyDown("down"))'],
    [/(\w+)\.cursors\.space\.isDown/g, '($1.cursors.space.isDown||bridge.keyDown("fire"))'],
  ];
  for (const [re, rep] of cursorMap) out = out.replace(re, rep);

  // wasd.A.isDown / wasd.SPACE.isDown
  const wasdMap: Array<[RegExp, string]> = [
    [/(\w+)\.wasd\.A\.isDown/g, '($1.wasd.A.isDown||bridge.keyDown("left"))'],
    [/(\w+)\.wasd\.D\.isDown/g, '($1.wasd.D.isDown||bridge.keyDown("right"))'],
    [/(\w+)\.wasd\.W\.isDown/g, '($1.wasd.W.isDown||bridge.keyDown("up"))'],
    [/(\w+)\.wasd\.S\.isDown/g, '($1.wasd.S.isDown||bridge.keyDown("down"))'],
    [/(\w+)\.wasd\.SPACE\.isDown/g, '($1.wasd.SPACE.isDown||bridge.keyDown("fire"))'],
  ];
  for (const [re, rep] of wasdMap) out = out.replace(re, rep);

  // Guard null keyboard at create time
  out = out.replace(
    /(\w+)\.cursors\s*=\s*(\w+)\.input\.keyboard\.createCursorKeys\(\)/g,
    '$1.cursors=($2.input.keyboard?$2.input.keyboard.createCursorKeys():{left:{isDown:false},right:{isDown:false},up:{isDown:false},down:{isDown:false},space:{isDown:false}})',
  );
  out = out.replace(
    /(\w+)\.wasd\s*=\s*(\w+)\.input\.keyboard\.addKeys\(([^)]*)\)/g,
    '$1.wasd=($2.input.keyboard?$2.input.keyboard.addKeys($3):{W:{isDown:false},A:{isDown:false},S:{isDown:false},D:{isDown:false},SPACE:{isDown:false}})',
  );

  return "/* __ghKbPatched */\n" + out;
}

/** Minimal Phaser 3 fallback if creator code empty */
const FALLBACK_GAME_JS = `
window.GamerholicArcadeGame = {
  boot: function(Phaser, bridge, parentEl) {
    var score = 0, running = false, power = 10;
    var scene = new Phaser.Class({
      Extends: Phaser.Scene,
      initialize: function() { Phaser.Scene.call(this, { key: "Main" }); },
      create: function() {
        this.cameras.main.setBackgroundColor("#12101f");
        this.add.text(12, 100, "Starter Phaser scene — paste your gameCode", {
          fontFamily: "system-ui", fontSize: "14px", color: "#ffffffaa"
        });
        this.input.on("pointerdown", function() {
          if (!running) return;
          score += Math.floor(power);
          bridge.score(score, false);
        });
        bridge.on("init", function(m) {
          var assets = (m && m.assets) || [];
          var w = assets.find(function(a){ return a.role === "weapon"; }) || assets[0];
          if (w) power = Math.max(10, Math.floor(w.effectivePower || 10));
        });
        bridge.on("start", function() { running = true; score = 0; bridge.score(0, false); });
        bridge.on("stop", function() { running = false; bridge.end(score); });
      }
    });
    return new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentEl,
      width: parentEl.clientWidth || 360,
      height: parentEl.clientHeight || 640,
      backgroundColor: "#070612",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: scene,
      input: { activePointers: 3 }
    });
  }
};
`;

export { FALLBACK_GAME_JS };
