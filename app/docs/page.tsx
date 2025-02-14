"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { aiGameCreationPrompt } from "../arcade-create/ai-prompt"
import { Gamepad2, Code, Shield, Zap, Book, Rocket } from "lucide-react"
import { motion } from "framer-motion"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground neon-grid">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <motion.h1
          className="text-5xl font-bold mb-8 text-center text-primary neon-glow"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Developer Documentation
        </motion.h1>

        <Tabs defaultValue="getting-started" className="mb-8">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 gap-4">
            <TabsTrigger value="getting-started" className="text-lg">
              <Rocket className="mr-2 h-5 w-5" />
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="api-reference" className="text-lg">
              <Code className="mr-2 h-5 w-5" />
              API Reference
            </TabsTrigger>
            <TabsTrigger value="ai-prompt" className="text-lg">
              <Zap className="mr-2 h-5 w-5" />
              AI Game Creation
            </TabsTrigger>
            <TabsTrigger value="security" className="text-lg">
              <Shield className="mr-2 h-5 w-5" />
              Security Measures
            </TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started">
            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Getting Started</CardTitle>
                <CardDescription>Begin your journey as a Gamerholic developer</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-4 text-gray-200">
                  <li>Sign up for a developer account</li>
                  <li>Set up your development environment</li>
                  <li>Create a new game project</li>
                  <li>Implement the Gamerholic SDK</li>
                  <li>Submit your game for review</li>
                </ol>
                <Button className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                  <Book className="mr-2 h-5 w-5" />
                  Read Full Guide
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-reference">
            <Card className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">API Reference</CardTitle>
                <CardDescription>Explore our comprehensive API documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-200">
                  <li>User authentication</li>
                  <li>In-game transactions</li>
                  <li>Leaderboard management</li>
                  <li>Game state persistence</li>
                </ul>
                <Button className="mt-6 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
                  <Code className="mr-2 h-5 w-5" />
                  View Full API Docs
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-prompt">
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">AI Game Creation Prompt</CardTitle>
                <CardDescription>Use this prompt with AI assistants to create your game</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap bg-gray-800 p-4 rounded-md overflow-auto text-gray-200 text-sm">
                  {aiGameCreationPrompt}
                </pre>
                <Button
                  onClick={() => navigator.clipboard.writeText(aiGameCreationPrompt)}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Copy Prompt
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Gamerholic Security Measures</CardTitle>
                <CardDescription>Understanding our robust anti-cheat system to ensure fair play</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SecurityFeature
                  title="Session-Based Token Authentication"
                  description="Each game session is secured with a unique token that includes encrypted information about the game, player, and session. This token is required for score submission, preventing unauthorized score posts."
                  icon={<Shield className="h-8 w-8 text-green-400" />}
                />
                <SecurityFeature
                  title="Server-Side Score Verification"
                  description="Our system employs advanced algorithms to verify submitted scores based on maximum possible score, typical score ranges, score accumulation rates, and historical performance data across all players."
                  icon={<Zap className="h-8 w-8 text-yellow-400" />}
                />
                <SecurityFeature
                  title="Adaptive Thresholds"
                  description="Our anti-cheat system continuously learns and adapts based on real player data, automatically adjusting thresholds for detecting suspicious scores."
                  icon={<Gamepad2 className="h-8 w-8 text-blue-400" />}
                />
                <SecurityFeature
                  title="Encrypted Score Submission"
                  description="All score submissions are encrypted end-to-end, protecting against man-in-the-middle attacks and ensuring the integrity of submitted scores during transmission."
                  icon={<Code className="h-8 w-8 text-purple-400" />}
                />
                <div className="bg-gray-800 p-6 rounded-lg">
                  <p className="text-gray-200 font-semibold mb-4">Note to Game Creators:</p>
                  <p className="text-gray-300">
                    While our system is designed to be robust, it's important to implement your own in-game anti-cheat
                    measures where possible. This could include server-side validations, secure random number
                    generation, and careful management of game state to prevent exploitation of game mechanics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function SecurityFeature({ title, description, icon }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  )
}

