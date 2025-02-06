import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GamePreviewProps {
  gameCode: string;
  gameCss: string;
}

export const GamePreview: React.FC<GamePreviewProps> = ({ gameCode, gameCss }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameInstance, setGameInstance] = useState<any>(null);
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameCode.trim()) {
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Enter your game code and click 'Update Preview'", canvas.width / 2, canvas.height / 2);
      }
      return;
    }

    // Apply CSS
    const styleElement = document.createElement("style");
    styleElement.textContent = gameCss;
    document.head.appendChild(styleElement);

    // Execute the game code
    try {
      const gameModule = { exports: {} };
      const wrappedCode = `
        (function(module, exports) {
          ${gameCode}
          if (typeof startGame === 'function') {
            module.exports = {
              start: startGame,
              update: typeof update === 'function' ? update : () => {},
              draw: typeof draw === 'function' ? draw : () => {},
              getScore: typeof getScore === 'function' ? getScore : () => 0,
              handleInput: typeof handleInput === 'function' ? handleInput : () => {},
            };
          } else {
            module.exports = { start: () => {}, update: () => {}, draw: () => {}, getScore: () => 0, handleInput: () => {} };
          }
        })(gameModule, gameModule.exports);
      `;
      // eslint-disable-next-line no-new-func
      new Function("gameModule", wrappedCode)(gameModule);

      const game = gameModule.exports;
      setGameInstance(game);

      if (typeof game.start === "function") {
        game.start(canvas);
      }

      setError(null);
    } catch (err) {
      console.error("Error executing game code:", err);
      setError(err.toString());
      if (ctx) {
        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Error: ${err.toString()}`, canvas.width / 2, canvas.height / 2);
      }
    }

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [gameCode, gameCss]);

  const gameLoop = () => {
    if (!gameInstance) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      if (typeof gameInstance.update === "function") {
        gameInstance.update();
      }
      if (typeof gameInstance.draw === "function") {
        gameInstance.draw(ctx);
      }

      // Draw the score
      ctx.fillStyle = "#fff";
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${gameInstance.getScore()}`, 10, 30);
    }

    const frameId = requestAnimationFrame(gameLoop);
    setAnimationFrameId(frameId);
  };

  const handleStartGame = () => {
    if (!gameInstance || typeof gameInstance.start !== "function") return;

    // Stop previous loop if running
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    gameInstance.start();
    gameLoop();
  };

  const handleUserInput = (event: Event) => {
    if (gameInstance && typeof gameInstance.handleInput === "function") {
      gameInstance.handleInput(event);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleUserInput);
    window.addEventListener("keyup", handleUserInput);
    window.addEventListener("mousedown", handleUserInput);
    window.addEventListener("mouseup", handleUserInput);
    window.addEventListener("mousemove", handleUserInput);

    return () => {
      window.removeEventListener("keydown", handleUserInput);
      window.removeEventListener("keyup", handleUserInput);
      window.removeEventListener("mousedown", handleUserInput);
      window.removeEventListener("mouseup", handleUserInput);
      window.removeEventListener("mousemove", handleUserInput);
    };
  }, [gameInstance]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4">
        <canvas
          id="gameCanvas"
          ref={canvasRef}
          width={400}
          height={400}
          className="border-2 border-primary rounded-lg mx-auto"
        />
        {error && (
          <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div className="flex justify-center mt-4">
          <Button
            onClick={handleStartGame}
            variant="default"
            className="w-48 h-12 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Start Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
