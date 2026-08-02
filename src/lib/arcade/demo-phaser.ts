/**
 * Seed arcade titles — Phaser 3 gameCode + CSS only (no full HTML).
 */

export function neonTapCss(): string {
  return `
#gh-arcade-root { background: radial-gradient(ellipse at 50% 28%, #1a1535, #070612 72%); }
`;
}

/** Neon tap — mobile-friendly Phaser 3 scene */
export function neonTapGameCode(title: string): string {
  const label = JSON.stringify(title || "Neon Tap");
  return `
window.GamerholicArcadeGame = {
  boot: function (Phaser, bridge, parentEl) {
    var score = 0;
    var running = false;
    var power = 10;
    var paid = false;

    var Main = new Phaser.Class({
      Extends: Phaser.Scene,
      initialize: function Main() {
        Phaser.Scene.call(this, { key: "Main" });
      },
      create: function () {
        var scene = this;
        this.targets = [];
        this.cameras.main.setBackgroundColor("#0b0a18");
        this.hint = this.add
          .text(0, 0, "Waiting for host…", {
            fontFamily: "system-ui,sans-serif",
            fontSize: "14px",
            color: "#ffffff99",
          })
          .setOrigin(0.5);
        this.modeText = this.add
          .text(0, 0, "", {
            fontFamily: "system-ui,sans-serif",
            fontSize: "11px",
            color: "#a78bfa",
            fontStyle: "bold",
          })
          .setOrigin(1, 0);

        this.layout = function () {
          var w = scene.scale.width;
          var h = scene.scale.height;
          // Host SCORE/TIME overlay uses top-left — keep free
          scene.hint.setPosition(w / 2, h * 0.5);
          scene.modeText.setPosition(w - 12, 12);
        };
        this.layout();
        this.scale.on("resize", this.layout, this);

        this.input.addPointer(2);
        this.input.on("pointerdown", function (pointer) {
          if (!running) return;
          scene.hit(pointer.x, pointer.y);
        });

        // Host owns the run timer (tick/stop). Do NOT end the match with a local timer.
        bridge.on("init", function (m) {
          paid = !!(m && m.paid);
          var assets = (m && m.assets) || [];
          var weap =
            assets.find(function (a) {
              return a.role === "weapon";
            }) || assets[0];
          if (weap) {
            power = Math.max(
              10,
              Math.floor(
                weap.effectivePower || 10 + (weap.bagPowerTokens || 0) * 0.1,
              ),
            );
          }
          scene.modeText.setText(paid ? "RANKED" : "FREE");
          // Wait for start — host timer already counting after insert
        });
        bridge.on("start", function (m) {
          running = true;
          score = 0;
          scene.clearTargets();
          scene.hint.setText("Tap orbs · " + ${label});
          scene.modeText.setText(paid ? "RANKED" : "FREE");
          scene.spawn();
          scene.spawn();
          bridge.score(0, false);
          // remainingSec from host is cosmetic; host auto-stops at 0
          void m;
        });
        bridge.on("tick", function (/* m */) {
          // Host clock only — optional UI; do not end the game here
        });
        bridge.on("stop", function () {
          // Timer hit 0, leave page, or manual end — always finalize score
          running = false;
          scene.hint.setText("Run over");
          bridge.end(score);
        });
        bridge.on("assets", function (m) {
          var assets = (m && m.assets) || [];
          var weap =
            assets.find(function (a) {
              return a.role === "weapon";
            }) || assets[0];
          if (weap) {
            power = Math.max(
              10,
              Math.floor(
                weap.effectivePower || 10 + (weap.bagPowerTokens || 0) * 0.1,
              ),
            );
          }
        });
      },
      clearTargets: function () {
        this.targets.forEach(function (t) {
          if (t.gfx) t.gfx.destroy();
        });
        this.targets = [];
      },
      spawn: function () {
        if (!running) return;
        var w = this.scale.width;
        var h = this.scale.height;
        var topPad = Math.max(88, h * 0.14);
        var side = Math.max(28, w * 0.07);
        var x = side + Math.random() * (w - side * 2);
        var y = topPad + Math.random() * (h - topPad - side);
        var r = 22 + Math.random() * 16;
        var hue = 110 + Math.random() * 90;
        var gfx = this.add.graphics();
        var draw = function (alpha) {
          gfx.clear();
          gfx.fillStyle(Phaser.Display.Color.HSLToColor(hue / 360, 0.9, 0.55).color, alpha);
          gfx.fillCircle(0, 0, r);
          gfx.lineStyle(2, 0xffffff, 0.2 * alpha);
          gfx.strokeCircle(0, 0, r + 10);
        };
        draw(1);
        gfx.setPosition(x, y);
        this.targets.push({
          x: x,
          y: y,
          r: r,
          life: 1.9 + Math.random() * 0.7,
          gfx: gfx,
          draw: draw,
        });
      },
      hit: function (px, py) {
        for (var i = this.targets.length - 1; i >= 0; i--) {
          var t = this.targets[i];
          var dx = px - t.x;
          var dy = py - t.y;
          var hitR = t.r + 16;
          if (dx * dx + dy * dy <= hitR * hitR) {
            t.gfx.destroy();
            this.targets.splice(i, 1);
            score += Math.floor(power);
            bridge.score(score, false);
            this.spawn();
            if (Math.random() > 0.35) this.spawn();
            return;
          }
        }
      },
      update: function (_t, dt) {
        if (!running) return;
        var sec = dt / 1000;
        if (Math.random() < sec * 1.1 && this.targets.length < 7) this.spawn();
        for (var i = this.targets.length - 1; i >= 0; i--) {
          var t = this.targets[i];
          t.life -= sec;
          if (t.life <= 0) {
            t.gfx.destroy();
            this.targets.splice(i, 1);
            continue;
          }
          t.draw(Math.min(1, t.life));
        }
      },
    });

    return new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentEl,
      backgroundColor: "#070612",
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: parentEl,
        width: parentEl.clientWidth || 360,
        height: parentEl.clientHeight || 640,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: Main,
      input: { activePointers: 3 },
      banner: false,
    });
  },
};
`;
}
