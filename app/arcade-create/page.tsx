"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
import { PlusCircle, Gamepad2, Eye, Code, Upload, X, DollarSign } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { GamePreview } from "@/components/game-preview"
import { balanceManager } from "@/lib/balance"
import { supabase } from "@/lib/supabase"
import { SuccessModal } from "@/components/success-modal"
import { ErrorModal } from "@/components/error-modal"
import { generateDepositWallet } from "@/lib/platformWallet"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const solana = new balanceManager()
interface User {
  userid: string
  username: string
  deposit_wallet: string
  avatar: string
}
const GAME: any = process.env.NEXT_PUBLIC_GAMER

const aiGameCreationPrompt = `Create a JavaScript-based game for the Gamerholic platform using the following structure and guidelines:

1. The game should be implemented as plain JavaScript that can run in a browser environment.
2. Use the canvas element provided by the platform for rendering the game.
3. Implement the game logic using vanilla JavaScript without any external libraries or frameworks.
4. The game must have a scoring system and should be challenging with increasing difficulty.
5. Implement the game using the following structure:

\`\`\`javascript
// Game variables (use let for variables that will change)
let score = 0;
let gameWidth = 800; // Default game width
let gameHeight = 600; // Default game height
// Add other necessary game variables here

function init(canvas) {
  // Initialize game elements and variables here
  // This function is called once when the game is loaded
  // Adjust game size based on the provided canvas
  gameWidth = canvas.width;
  gameHeight = canvas.height;
}

function start() {
  // Reset game state and start the game
  score = 0;
  // Initialize or reset other game variables
  // This function is called each time the game starts or restarts
}

function update(deltaTime, getCurrentTimer) {
  // Update game logic here
  // This function is called every frame
  // deltaTime is the time passed since the last frame in seconds
  // getCurrentTimer is a function that returns the current game timer value
  const currentTimer = getCurrentTimer();
  if (currentTimer <= 0) {
    gameOver();
    return;
  }
  // Update other game elements and increase difficulty over time
}

function draw(ctx, getCurrentTimer) {
  // Clear the canvas and draw game elements here
  // ctx is the 2D rendering context for the canvas
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  // Draw game elements
  drawUI(ctx, getCurrentTimer);
  // Add more drawing code for your game elements
}

function drawUI(ctx, getCurrentTimer) {
  // Draw score and timer
  const currentTimer = getCurrentTimer();
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(\`Score: \${score}\`, 20, 40);
  ctx.textAlign = 'right';
  const minutes = Math.floor(currentTimer / 60);
  const seconds = Math.ceil(currentTimer % 60);
  ctx.fillText(\`Time: \${minutes}:\${seconds.toString().padStart(2, '0')}\`, gameWidth - 20, 40);
}

function handleInput(event) {
  // Handle user input here
  // This function is called when the user interacts with the game
  // event.type will be 'keydown', 'keyup', 'mousedown', 'mouseup', or 'mousemove'
  // event will have properties like key, code, clientX, clientY, etc.
}

function getScore() {
  return score;
}

function gameOver() {
  // Handle game over state
  console.log("Game Over! Final Score:", score);
  // You may want to stop the game loop or show a game over screen here
}

// Initialize the game when the script loads
init(document.querySelector('canvas'));

// Expose necessary functions to the global scope
window.startGame = start;
window.handleInput = handleInput;
window.update = update;
window.draw = draw;
window.getScore = getScore;
\`\`\`

6. Do not include any HTML structure tags ie: 'body'. The game will be embedded in an existing structure.

7. Ensure that the game can be started by calling the global startGame() function.

8. Implement the getScore() function that returns the current score, and expose it to the global scope.

9. Make sure to implement proper game over conditions and update the score accordingly.

10. The game should be responsive and adjust to different canvas sizes. Use the gameWidth and gameHeight variables for positioning and sizing game elements.

11. Implement error handling to prevent the game from crashing due to runtime errors.

12. Use ES6+ syntax and best practices for clean, readable code.

13. Do not use setTimeout or setInterval for game loops or animations. The platform will handle calling the update and draw functions.

14. Do not add event listeners directly. Instead, use the handleInput function to process user inputs.

15. Avoid using global variables outside of the provided structure. Encapsulate game state within the functions.

16. Ensure that all game logic is contained within the provided functions (init, start, update, draw, handleInput, drawUI, gameOver).

17. The game should have a clear objective, scoring system, and increasing difficulty to engage players.

18. Include comments to explain complex logic or game mechanics for easier understanding and maintenance.

19. Ensure that the score and timer are always visible and properly positioned on the screen.

20. Use relative positioning for game elements based on the gameWidth and gameHeight variables to ensure consistency across different canvas sizes.

21. Implement a drawUI function to handle the rendering of the score, timer, and any other UI elements consistently.

22. Use appropriate font sizes and colors for UI elements to ensure readability against the game background.

23. Consider implementing a simple pause functionality to enhance user experience.

24. Test the game at different canvas sizes to ensure that all elements are visible and the game remains playable.

25. // Responsive Design
- Ensure the game canvas is centered in the game view.
- Make sure the score and timer are always visible, regardless of screen size.
- Use relative positioning for UI elements (score, timer) to ensure they remain visible on different screen sizes.
- Consider using percentages or viewport units for positioning instead of fixed pixel values.
- Implement a minimum size for the game canvas to ensure playability on smaller screens.

26. // Game Timer
- The game timer is provided by the platform through the getCurrentTimer function.
- Use getCurrentTimer() to get the current time remaining in the game.
- Update the game state based on the current timer value in the update function.
- Display the current time in the drawUI function.
- Implement game over logic when the timer reaches zero.

Use this template as a starting point for your game code. Be creative and implement an engaging game that fits within this structure. The game will be previewed in real-time as you develop it, so focus on creating a fun and interactive experience that works seamlessly with the Gamerholic platform. Remember to adjust game difficulty, speed, or complexity based on the score or elapsed time to keep the game challenging and engaging throughout the play session.

Important CSS Note: When writing custom CSS for your game, do not use any selectors that target the <body> tag or any other elements outside of the game canvas. Your CSS should only affect elements within the game canvas to avoid interfering with the main site's styling.`

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
    fullSizeImage: null as File | null,
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRefFullSize = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState<string | null>(null)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [user_id, setUserId]: any = useState("")
  const [user_name, setUserName]: any = useState("")
  const [user_avater, setUserAvatar]: any = useState("")
  const [avatarFile, setAvatarFile]: any = useState("")

  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(180) // Set initial timer to 3 minutes (180 seconds)

  const [userData, setUserData]: any = useState<Partial<User>>({})

  useEffect(() => {
    if (publicKey) {
      fetchUser()
    }
  }, [publicKey])
  const isFetching = false

  const fetchUser = async () => {
    if (!publicKey) return

    try {
      const { data, error } = await supabase.from("users").select("*").eq("publicKey", publicKey.toBase58()).single()

      if (error) {
        console.error("Select Error:", error)
        return
      }

      if (!data) {
        const { error: insertError } = await supabase.from("users").insert([{ publicKey: publicKey.toBase58() }])

        if (insertError) {
          console.error("Insert Error:", insertError)
        } else {
          setShowUserNameModal(true)
          console.log("New publicKey inserted into the database.")
        }
      } else {
        setUserId(data.id)
        if (!data.username) {
          setShowUserNameModal(true)
        } else {
          setUserName(data.username)
          setUserAvatar(data.avatar_url)
          setUserData({
            userid: data.id,
            username: data.username,
            deposit_wallet: data.deposit_wallet,
            avatar: data.avatar,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const handleGameCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGameCode(e.target.value)
    if (e.target.value) {
      startGame()
    }
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

  const handleFullSizeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData((prev) => ({ ...prev, fullSizeImage: file }))
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
      formDataToSend.append("fullSizeImage", formData.fullSizeImage)

      //check user game balance
      const GAMErBalance = await solana.getTokenBalance(userData.deposit_wallet, GAME)
      //check user sol balance
      let solBalance = await solana.getBalance(userData.deposit_wallet)
      let createFee: any = process.env.NEXT_PUBLIC_ARCADE_CREATE_FEE
      solBalance = solBalance / 10 ** 9
      createFee = createFee / 10 ** 9

      if (solBalance < createFee) {
        setShowErrorModal(true)
        setErrorMessage("Go to your profile and deposit the game creation fee to your wallet")
      } else {
        const response = await fetch("/api/arcade/create", {
          method: "POST",
          body: formDataToSend,
        })

        const result = await response.json()

        if (!result.success) {
          setShowErrorModal(true)
          setErrorMessage("error creating game")
          // throw new Error(result.error || "Failed to create game")
        } else {
          setSuccessMessage("game created")
          setShowSuccessModal(true)
        }
      }

      // router.push("/my-games")
    } catch (error: any) {
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

  const startGame = () => {
    // Force a re-render of the GamePreview component
    setGameCode((prevCode) => prevCode.trim())
  }

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore)
  }

  const handleTimerUpdate = (newTimer: number) => {
    setTimer(newTimer)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleAvatarUpload = async (event: any) => {
    console.log("uploading")
    const file = event.target.files?.[0]
    if (file) {
      const fileName = `${Date.now()}_${file.name}` // Unique filename
      const { data, error } = await supabase.storage
        .from("images") // Your bucket name
        .upload(fileName, file)

      if (error) {
        console.error("Upload Error:", error)
      } else {
        console.log("File uploaded successfully:", data)
        const url = "https://bwvzhdrrqvrdnmywdrlm.supabase.co/storage/v1/object/public/" + data.fullPath
        await updateUserAvatar(publicKey, url)
      }
    }
  }

  const updateUserAvatar = async (publicKey: any, avatarUrl: any) => {
    const { error } = await supabase.from("users").update({ avatar_url: avatarUrl }).eq("publicKey", publicKey)
    setAvatarFile(avatarUrl)
    if (error) {
      console.error("Error updating avatar:", error)
    } else {
      console.log("Avatar updated successfully!")
    }
  }

  const handleSetUserName = async () => {
    const name = userData.name
    if (!userData.deposit_wallet) {
      const data_wallet: any = await generateDepositWallet(publicKey)
    }
    const { data, error } = await supabase
      .from("users")
      .update({ username: name }) // Updating the username
      .eq("publicKey", publicKey) // Condition to match the publicKey

    if (error) {
      // console.error("Update Error:", error);
      handleErrorNotification("theres an error " + error)
    } else {
      // console.log("Username updated successfully:", data);
      setShowUserNameModal(false)
      handleSuccessNotification("user name updated")
    }
    fetchUser()
  }

  const handleSuccessNotification = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessModal(true)
  }

  const handleErrorNotification = (message: string) => {
    setErrorMessage(message)
    setShowErrorModal(true)
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

        {/* Updated Tabs component with defaultValue="preview" */}
        <Tabs defaultValue="preview" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="text-lg">
              <Eye className="w-5 h-5 mr-2" />
              Game Details
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-lg">
              <Gamepad2 className="w-5 h-5 mr-2" />
              Game Preview
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-lg">
              <DollarSign className="w-5 h-5 mr-2" />
              Pricing
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-primary/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <Label htmlFor="playFee" className="text-lg text-primary">
                          Play Fee (GAMEr)
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
                          placeholder="Enter play fee in GAMEr tokens"
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
                    <div className="space-y-6">
                      <div className="bg-background/20 p-4 rounded-lg">
                        <Label htmlFor="image" className="text-lg text-primary block mb-2">
                          Thumbnail Image
                        </Label>
                        <div className="flex items-center space-x-4 mb-4">
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
                        </div>
                        {previewImage && (
                          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={previewImage || "/placeholder.svg"}
                              alt="Thumbnail Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="bg-background/20 p-4 rounded-lg">
                        <Label htmlFor="fullSizeImage" className="text-lg text-primary block mb-2">
                          Full Size Image
                        </Label>
                        <div className="flex items-center space-x-4 mb-4">
                          <Button
                            type="button"
                            onClick={() => fileInputRefFullSize.current?.click()}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all duration-300 flex items-center space-x-2"
                          >
                            <Upload className="w-5 h-5" />
                            <span>Choose Full Size Image</span>
                          </Button>
                          <Input
                            id="fullSizeImage"
                            name="fullSizeImage"
                            type="file"
                            ref={fileInputRefFullSize}
                            onChange={handleFullSizeImageUpload}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                        {formData.fullSizeImage && (
                          <div className="bg-gray-100 rounded-lg p-2">
                            <p className="text-sm text-gray-600 truncate">{formData.fullSizeImage.name}</p>
                          </div>
                        )}
                      </div>
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
                    onClick={startGame}
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
                <div className="mb-4 flex justify-between items-center bg-background/50 p-4 rounded-lg">
                  <div className="text-xl font-bold text-primary">Score: {score}</div>
                  <div className="text-xl font-bold text-primary">Time: {Math.ceil(timer)}s</div>
                </div>
                <GamePreview
                  gameCode={gameCode}
                  gameCss={gameCss}
                  onScoreUpdate={handleScoreUpdate}
                  currentTimer={timer}
                  onGameStart={() => setTimer(180)} // Reset timer to 3 minutes when game starts
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pricing">
            <Card className="bg-gradient-to-r from-green-900/50 to-teal-900/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-400" />
                  Pricing and Submission Process
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg text-gray-300">
                  Add your AI-generated game to the Gamerholic High Score Arcade. Each time a player inserts coins to
                  play your game, you earn money!
                </p>
                <div className="bg-background/20 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-primary mb-2">Submission Cost</h3>
                  <p className="text-gray-300">
                    It costs <span className="text-primary font-bold">0.10 Solana</span> to add your game.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-primary">Testing Process:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li>
                      Once your game is added, a tester will ensure it's properly integrated into the high score arcade.
                    </li>
                    <li>The tester is paid a portion of the 0.10 Solana submission fee.</li>
                    <li>After successful testing, your game will be live and ready to play.</li>
                    <li>If there are issues with your game, you can re-submit at no additional cost.</li>
                  </ol>
                </div>
                <div className="bg-background/20 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-primary mb-2">Form Helper: Top Payout</h3>
                  <p className="text-gray-300">
                    "Top Payout" refers to the number of players on your leaderboard who will get paid. For example, if
                    you set the top payout to 10, then the top 10 players on the leaderboard will get paid each time
                    another player fails to beat their score.
                  </p>
                </div>
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

        <Dialog open={showUserNameModal} onOpenChange={() => setShowUserNameModal(false)}>
          <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-primary">Profile Setup</DialogTitle>
              <DialogDescription>Complete your profile in 3 easy steps</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-primary mb-2">1. Set Your Avatar</h3>
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={avatarFile} />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                        {userData.name ? userData.name[0].toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors">
                          <Upload size={16} />
                          <span>Upload Avatar</span>
                        </div>
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-primary mb-2">2. Set Your Username</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={userData.name || ""}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      placeholder="e.g. CyberNinja"
                      className="bg-background/50 border-primary/20"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-primary mb-2">3. Generate Deposit Address</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click 'Update Profile' to generate your unique deposit address.
                  </p>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowUserNameModal(false)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleSetUserName}
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Update Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showSuccessModal && (
          <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
        )}
        {showErrorModal && (
          <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
        )}
      </main>
    </div>
  )
}

