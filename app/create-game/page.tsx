"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Gamepad2, Eye, Code, Upload, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { GamePreview } from "@/components/game-preview"
import { aiGameCreationPrompt } from "./ai-prompt"

export default function CreateGamePage() {
  const { toast } = useToast()
  const router = useRouter()
  const { publicKey } = useWallet()
  const [gameCode, setGameCode] = useState("")
  const [gameCss, setGameCss] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    playFee: "",
    topPayout: "",
    category: "",
    rules: "",
    image: null as File | null,
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState<string | null>(null)

  const handleGameCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGameCode(e.target.value)
  }

  const handleGameCssChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGameCss(e.target.value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData((prev) => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: null }))
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must connect your wallet to create a game",
      })
      return
    }

    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataToSend.append(key, value)
        }
      })
      formDataToSend.append("gameCode", gameCode)
      formDataToSend.append("gameCss", gameCss)
      formDataToSend.append("creatorWallet", publicKey.toBase58())

      const response = await fetch("/api/create-game", {
        method: "POST",
        body: formDataToSend,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create game")
      }

      toast({
        title: "Success",
        description: "Game submitted for testing. You'll be notified once it's approved.",
      })

      router.push("/my-games")
    } catch (error:any) {
      console.error("Error creating game:", error)
      setError(error.message || "An error occurred while creating the game.")
      setAiPrompt(`I'm trying to create a game on the Gamerholic platform, but I'm encountering the following error:

${error.message}

Here's my current game code:

\`\`\`javascript
${gameCode}
\`\`\`

Can you help me identify the issue and suggest how to fix it?`)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error creating game. Please check the error message and AI prompt for assistance.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-20">
        <h1 className="text-4xl font-bold mb-6 text-center text-primary neon-glow">Create Your Game</h1>

        {!publicKey && (
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="pt-6">
              <p className="mb-4 text-center text-lg">Please connect your wallet to create a game.</p>
              <div className="flex justify-center">
                <WalletMultiButton className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/80 hover:to-secondary/80 transition-all duration-300 rounded-full font-bold text-lg shadow-lg hover:shadow-xl" />
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="details" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="text-lg">
              <Eye className="w-5 h-5 mr-2" />
              Game Details
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-lg">
              <Gamepad2 className="w-5 h-5 mr-2" />
              Game Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-lg text-primary">
                        Game Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-background/50 border-primary/20 focus:border-primary focus:ring-primary text-lg"
                        placeholder="Enter your game title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="image" className="text-lg text-primary">
                        Upload Image
                      </Label>
                      <div className="mt-1 flex items-center space-x-4">
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all duration-300 flex items-center space-x-2"
                        >
                          <Upload className="w-5 h-5" />
                          <span>Choose Image</span>
                        </Button>
                        <Input
                          id="image"
                          name="image"
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        {previewImage && (
                          <div className="relative">
                            <img
                              src={previewImage || "/placeholder.svg"}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="playFee" className="text-lg text-primary">
                        Play Fee (SOL)
                      </Label>
                      <Input
                        id="playFee"
                        name="playFee"
                        type="number"
                        step="0.01"
                        value={formData.playFee}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-background/50 border-primary/20 focus:border-primary focus:ring-primary text-lg"
                        placeholder="Enter play fee in SOL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="topPayout" className="text-lg text-primary">
                        Top Payout (number of players)
                      </Label>
                      <Input
                        id="topPayout"
                        name="topPayout"
                        type="number"
                        value={formData.topPayout}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-background/50 border-primary/20 focus:border-primary focus:ring-primary text-lg"
                        placeholder="Enter number of top players to payout"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-lg text-primary">
                        Game Category
                      </Label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded-md border border-primary/20 bg-background/50 mt-1 focus:border-primary focus:ring-primary text-lg"
                        required
                      >
                        <option value="">Select a category</option>
                        <option value="Strategy">Strategy</option>
                        <option value="Puzzle">Puzzle</option>
                        <option value="Shooter">Shooter</option>
                        <option value="Arcade">Arcade</option>
                        <option value="RPG">RPG</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-lg text-primary">
                        Game Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-background/50 border-primary/20 focus:border-primary focus:ring-primary text-lg"
                        rows={4}
                        placeholder="Describe your game"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rules" className="text-lg text-primary">
                        Game Rules
                      </Label>
                      <Textarea
                        id="rules"
                        name="rules"
                        value={formData.rules}
                        onChange={handleInputChange}
                        className="mt-1 bg-background/50 border-primary/20 focus:border-primary focus:ring-primary text-lg"
                        rows={4}
                        placeholder="Enter game rules (optional)"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                  disabled={!publicKey}
                >
                  {publicKey ? (
                    <>
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Create Game
                    </>
                  ) : (
                    "Connect Wallet to Create Game"
                  )}
                </Button>
              </div>
              {error && (
                <Card className="mt-8 bg-red-100 border-red-300">
                  <CardHeader>
                    <CardTitle className="text-red-800">Error Creating Game</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-800 mb-4">{error}</p>
                    <h3 className="text-lg font-semibold mb-2">AI Assistance Prompt</h3>
                    <p className="mb-2">Use the following prompt with an AI assistant to help fix the error:</p>
                    <Textarea
                      value={aiPrompt}
                      readOnly
                      className="w-full h-64 p-2 bg-white border border-gray-300 rounded"
                    />
                    <Button onClick={() => navigator.clipboard.writeText(aiPrompt)} className="mt-4">
                      Copy AI Prompt
                    </Button>
                  </CardContent>
                </Card>
              )}
            </form>
          </TabsContent>
          <TabsContent value="preview">
            <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary flex items-center">
                  <Gamepad2 className="w-6 h-6 mr-2 text-purple-400" />
                  Game Code and Preview
                </CardTitle>
                <CardDescription className="text-lg text-gray-300">
                  Enter your game code and CSS, then preview it before submitting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="gameCode" className="text-lg text-primary">
                      Game Code
                    </Label>
                    <Textarea
                      id="gameCode"
                      value={gameCode}
                      onChange={handleGameCodeChange}
                      className="mt-2 font-mono text-sm bg-background/50 border-primary/20 focus:border-primary focus:ring-primary"
                      rows={15}
                      placeholder="Enter your game code here"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gameCss" className="text-lg text-primary">
                      Game CSS
                    </Label>
                    <Textarea
                      id="gameCss"
                      value={gameCss}
                      onChange={handleGameCssChange}
                      className="mt-2 font-mono text-sm bg-background/50 border-primary/20 focus:border-primary focus:ring-primary"
                      rows={10}
                      placeholder="Enter your game's CSS here"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      // Force a re-render of the GamePreview component
                      setGameCode((prevCode) => prevCode.trim())
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    Update Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="mt-8 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary flex items-center">
                  <Gamepad2 className="w-6 h-6 mr-2 text-indigo-400" />
                  Game Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GamePreview gameCode={gameCode} gameCss={gameCss} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Card className="mt-8 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center">
              <Code className="w-6 h-6 mr-2 text-purple-400" />
              AI Game Creation Prompt
            </CardTitle>
            <CardDescription className="text-lg text-gray-300">
              Use this prompt with AI assistants like ChatGPT to help create your game code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={aiGameCreationPrompt}
              readOnly
              className="mt-2 font-mono text-sm h-64 overflow-auto bg-background/50 border-primary/20"
            />
            <Button
              onClick={() => navigator.clipboard.writeText(aiGameCreationPrompt)}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Copy Prompt
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

