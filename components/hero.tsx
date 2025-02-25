import { Button } from "@/components/ui/button";
import { Gamepad2 } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section
      className="py-16 sm:py-24 px-4 text-center relative overflow-hidden rounded-lg shadow-2xl mb-12"
      style={{
        backgroundImage: "url('/home5.png')", // Replace with your image path
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10">
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 sm:mb-8 text-transparent text-white neon-glow glitch-effect"
          data-text="I Win For A Living"
        >
          I Win For A Living
        </h1>
        <p className="text-xl sm:text-2xl mb-8 sm:mb-10 max-w-2xl mx-auto text-gray-300">
          Solana Esports & Arcade
          <br />
          Heads Up, Tournaments, High Score Arcade, Grabbit
          <br />
          Win & Get Paid In Crypto
        </p>
        <p className="text-2xl mb-8 sm:mb-10 max-w-2xl mx-auto text-gray-300">
          <h2>

          Contract: <a href="https://pump.fun/A16i7fjFagzf2Ejezhc4xidcZ8J7utmLLQCqzZRWpump" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            A16i7...ZRWpump
          </a>
          </h2>

        </p>
      </div>
    </section>
  );
}