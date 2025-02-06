"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2, Zap, Trophy, Coins, Shield, Users, Rocket, Globe } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <motion.h1
          className="text-5xl font-bold mb-8 text-center text-primary neon-glow"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          About Gamerholic
        </motion.h1>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <p className="text-xl mb-6 text-center max-w-3xl mx-auto">
            Gamerholic is the ultimate destination for crypto gaming enthusiasts, combining the thrill of gaming with
            the innovation of blockchain technology. Our platform empowers players and developers alike in a secure,
            transparent, and rewarding environment.
          </p>
          <div className="flex justify-center">
            <Link href="/discover">
              <Button className="px-8 py-4 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <Gamepad2 className="mr-2 h-5 w-5" />
                Explore Games
              </Button>
            </Link>
          </div>
        </motion.section>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-8 text-center text-secondary">Why Choose Gamerholic?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Gamepad2 className="h-12 w-12 text-purple-400" />}
              title="AI-Powered Game Creation"
              description="Leverage cutting-edge AI technology to design, develop, and deploy games quickly and efficiently."
            />
            <FeatureCard
              icon={<Zap className="h-12 w-12 text-yellow-400" />}
              title="Play-to-Earn Mechanics"
              description="Earn real cryptocurrency rewards for your gaming skills and achievements."
            />
            <FeatureCard
              icon={<Trophy className="h-12 w-12 text-green-400" />}
              title="Competitive Leaderboards"
              description="Climb the ranks and compete against players worldwide for top positions and rewards."
            />
            <FeatureCard
              icon={<Coins className="h-12 w-12 text-blue-400" />}
              title="Transparent Economics"
              description="Benefit from a fair and transparent economic system with clear fee structures and reward distributions."
            />
            <FeatureCard
              icon={<Shield className="h-12 w-12 text-red-400" />}
              title="Robust Security"
              description="Play with confidence knowing our platform employs advanced anti-cheat systems and secure blockchain technology."
            />
            <FeatureCard
              icon={<Users className="h-12 w-12 text-indigo-400" />}
              title="Vibrant Community"
              description="Join a thriving ecosystem of players, developers, and crypto enthusiasts sharing ideas and experiences."
            />
          </div>
        </motion.section>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-8 text-center text-secondary">Our Mission</h2>
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-primary/20">
            <CardContent className="p-8">
              <p className="text-lg text-center">
                At Gamerholic, we're on a mission to revolutionize the gaming industry by seamlessly integrating
                blockchain technology and artificial intelligence. We aim to create a decentralized gaming ecosystem
                that empowers both players and developers, fostering innovation, fair play, and economic opportunities
                for all participants.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}>
          <h2 className="text-3xl font-bold mb-8 text-center text-secondary">Join the Revolution</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <Link href="/discover">
              <Button className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <Gamepad2 className="mr-2 h-5 w-5" />
                Start Playing
              </Button>
            </Link>
            <Link href="/create-game">
              <Button className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <Rocket className="mr-2 h-5 w-5" />
                Create a Game
              </Button>
            </Link>
            <Link href="/community">
              <Button className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <Globe className="mr-2 h-5 w-5" />
                Join Community
              </Button>
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-primary/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold text-primary">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300">{description}</p>
      </CardContent>
    </Card>
  )
}

