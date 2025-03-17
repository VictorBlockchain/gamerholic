"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import {
  Trophy,
  Zap,
  Info,
  Wallet,
  MessageSquare,
  Send,
  Check,
  Gamepad2,
  ThumbsUp,
  AlertTriangle,
  Swords,
  DollarSign,
  ExternalLink,
} from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import type { UserData } from "@/components/modals/profile-update-modal"
import {
  fetchChatRooms,
  createChatRoom,
  fetchChatMessages,
  isPlayerBannedFromChat,
  sendChatMessageToRoom,
  fetchPendingChallenges,
  fetchGameHistory,
  handleSendChallenge,
  handleCancelChallenge,
  handleAcceptChallenge,
  handleRejectChallenge,
  handleReportScore,
  handleConfirmScore,
  handleDisputeScore,
  handleMutualCancel,
  handleSelect,
  type ChatRoom,
  type ChatMessage,
  type EsportsGame,
} from "@/lib/services"
import { ChatPopup } from "@/components/chat-popup"
import { EsportsChallengeModal } from "@/components/modals/challenge-send-modal"
import { ChallengeCancelModal } from "@/components/modals/challenge-cancel-modal"
import { ChallengeAcceptModal } from "@/components/modals/challenge-accept-modal"
import { ChallengeScoreModal } from "@/components/modals/challenge-score-modal"
import { ChallengeConfirmScoreModal } from "@/components/modals/challenge-confirm-score-modal"
import { ChallengeDisputeScoreModal } from "@/components/modals/challenge-dispute-score-modal"
import { ChallengeMutualCancelModal } from "@/components/modals/challenge-mutual-cancel-modal"
import { SuccessModal } from "@/components/modals/success-modal"
import { ErrorModal } from "@/components/modals/error-modal"

// Status codes
// 1 = challenge sent
// 2 = accepted
// 3 = scored
// 4 = score accepted
// 5 = disputed
// 6 = mutual cancel requested
// 7 = mutual cancel accepted
// 8 = dispute resolved
// 9 = completed

// Helper component for the "How It Works" section
const HowItWorksSection = () => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 mt-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-indigo-600/5 z-0"></div>
      <CardHeader className="relative z-10">
        <CardTitle className="text-2xl text-primary flex items-center">
          <Info className="mr-2" /> How It Works
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <ol className="space-y-4">
          {[
            { icon: Wallet, text: "Deposit Solana into your deposit wallet", color: "text-green-400" },
            {
              icon: MessageSquare,
              text: "Communicate with your opponent in the chatroom and agree to the rules of your match",
              color: "text-blue-400",
            },
            {
              icon: Send,
              text: "Send challenge to your opponent (you must both have the game amount + 5% service fee in your deposit wallet)",
              color: "text-purple-400",
            },
            { icon: Check, text: "Your opponent must accept the challenge", color: "text-cyan-400" },
            { icon: Gamepad2, text: "Play your game and report the score", color: "text-pink-400" },
            { icon: ThumbsUp, text: "Confirm the score", color: "text-yellow-400" },
          ].map((step, index) => (
            <li key={index} className="flex items-start group">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold mr-3 transition-transform duration-300 group-hover:scale-110">
                {index + 1}
              </span>
              <div className="flex items-center">
                <step.icon className={`w-5 h-5 mr-2 ${step.color}`} />
                <span className="group-hover:text-white transition-colors duration-300">{step.text}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 p-4 bg-black/30 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            Funds are transferred from the losing player's wallet to the winner. You will not be able to withdraw funds
            from your deposit wallet while you have an active esports game.
          </p>
          <div className="mt-4 flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-200">
              Disputes require video evidence. If you lose 3 disputes within 7 days, you will be banned from the
              platform.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EsportsDesktop() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, player, profile, balance } = useUser()

  // State variables
  const [activeTab, setActiveTab] = useState("chat")
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [newChatRoomName, setNewChatRoomName] = useState("")
  const [pendingChallenges, setPendingChallenges] = useState<EsportsGame[]>([])
  const [gameHistory, setGameHistory] = useState<EsportsGame[]>([])
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [challengeData, setChallengeData] = useState<Partial<EsportsGame>>({})
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<EsportsGame | null>(null)
  const [availableGames, setAvailableGames] = useState<string[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [userData, setUserData] = useState<UserData>({})
  const [opponentAvatar, onSelectOpponentAvatar] = useState<string>("")
  const [challengeError, setChallangeError] = useState("")
  const [openChats, setOpenChats] = useState<{ id: string; name: string; avatar: string }[]>([])
  
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showReportScoreModal, setShowReportScoreModal] = useState(false)
  const [esportsRecords, setEsportsRecords] = useState([])
  const [showConfirmScoreModal, setShowConfirmScoreModal] = useState(false)
  const [showDisputeScoreModal, setShowDisputeScoreModal] = useState(false)
  const [showMutualCancelModal, setShowMutualCancelModal] = useState(false)
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")

  // Popular games list
  const popularGames: string[] = [
    "Chess",
    "Madden NFL",
    "NBA 2K",
    "FIFA",
    "Call of Duty",
    "Fortnite",
    "Apex Legends",
    "Valorant",
    "Counter-Strike 2",
    "League of Legends",
    "Dota 2",
    "Overwatch 2",
    "Rocket League",
    "PUBG",
    "Rainbow Six Siege",
    "Street Fighter",
    "Tekken",
    "Super Smash Bros",
    "Halo Infinite",
    "Gears of War",
    "Warzone",
  ].sort((a, b) => a.localeCompare(b))


  // Fetch data on component mount
  useEffect(() => {
    if (isAuthenticated && player) {
      loadChatRooms()
      loadPendingChallenges()
      loadGameHistory()
      setAvailableGames(popularGames)
      
      // Check if profile needs to be set up
      if (profile && (!profile.name || !profile.avatar)) {
        setUserData({
          ...profile,
          player: player,
        })
        setShowUserNameModal(true)
      }
    }
  }, [isAuthenticated, player, profile])
  
  // Subscribe to chat messages
  useEffect(() => {
    if (selectedChatRoom) {
      const chatRoomSubscription = supabase
        .channel(`chatroom-${selectedChatRoom.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `chatroom_id=eq.${selectedChatRoom.id}`,
          },
          (payload) => {
            setMessages((prevMessages) => [...prevMessages, payload.new as ChatMessage])
          },
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(chatRoomSubscription)
      }
    }
  }, [selectedChatRoom])

  useEffect(() => {
    if (!player) {
      console.log("Player is null or undefined. Skipping subscription.");
      return;
    }
    
    console.log("Setting up realtime subscription for player:", player);
    
    const channel = supabase
      .channel(`esports-${player}`) // Unique channel name
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
          schema: "public", // Specify the schema
          table: "esports", // Specify the table
          filter: `or(player1.eq.${player},player2.eq.${player})`, // Filter by player1 OR player2
        },
        (payload: any) => {
          console.log("Realtime payload received:", payload);

            const data = payload.new; // For INSERT and UPDATE events
            console.log("New data:", data);
            setPendingChallenges(data);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error("Subscription error:", err);
        } else {
          console.log("Subscription status:", status);
        }
      });

    // Cleanup function
    return () => {
      console.log("Unsubscribing from channel:", `esports-${player}`);
      channel.unsubscribe();
    };
  }, [player]);
  
  
  // Auto-complete for opponent search
  useEffect(() => {
    const fetchUsers = async () => {
      if (query.length === 0) {
        setSuggestions([])
        return
      }
      
      const { data, error } = await supabase.from("players").select("name, avatar").ilike("name", `%${query}%`)
      
      if (error) {
        console.error("Error fetching users:", error)
      } else {
        setSuggestions(data.filter((user: any) => user.name !== profile?.name))
        setShowDropdown(true)
      }
    }
    
    const delayDebounceFn = setTimeout(() => {
      fetchUsers()
    }, 300) // debounce for 300ms
    
    return () => clearTimeout(delayDebounceFn)
  }, [query, profile?.name])

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  // Load chat rooms
  const loadChatRooms = async () => {
    const rooms = await fetchChatRooms()
    setChatRooms(rooms)
  }
  
  // Handle chat room selection
  const handleChatRoomSelect = async (chatRoom: ChatRoom) => {
    setSelectedChatRoom(chatRoom)
    const messages = await fetchChatMessages(chatRoom.id)
    setMessages(messages)
  }

  // Create a new chat room
  const handleNewChatRoom = async () => {
    if (newChatRoomName.trim() === "") return

    const newRoom = await createChatRoom(newChatRoomName)
    if (newRoom) {
      setChatRooms((prev) => [...prev, newRoom])
      setNewChatRoomName("")
    } else {
      toast({
        title: "Failed to create chatroom",
        description: "An error occurred while creating the chatroom.",
        variant: "destructive",
      })
    }
  }

  // Send a chat message
  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedChatRoom || !player || !isAuthenticated) {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please connect your wallet to chat.",
          variant: "destructive",
        })
      }
      return
    }
    
    // Check if user is banned from chat
    const isBanned = await isPlayerBannedFromChat(player)
    if (isBanned) {
      toast({
        title: "Chat Restricted",
        description: "You are currently banned from chatting.",
        variant: "destructive",
      })
      return
    }
    
    // Send the message
    const success = await sendChatMessageToRoom({
      chatroom_id: selectedChatRoom.id,
      sender_id: profile?.id || "",
      sender_name: profile?.name || "",
      sender: player,
      sender_avatar: profile?.avatar || "",
      content: newMessage,
    })
    
    if (success) {
      setNewMessage("")
      const messages = await fetchChatMessages(selectedChatRoom.id)
      setMessages(messages)
    } else {
      toast({
        title: "Failed to send message",
        description: "An error occurred while sending the message.",
        variant: "destructive",
      })
    }
  }

  // Load pending challenges
  const loadPendingChallenges = async () => {
    if (!player) return
    const challenges = await fetchPendingChallenges(player)
    setPendingChallenges(challenges)
  }

  // Load game history
  const loadGameHistory = async () => {
    if (!player) return
    const history = await fetchGameHistory(player)
    setGameHistory(history)
  }
  
  // Handle sending a challenge
  const onSendChallenge = async () => {
    if (!player || !profile) return
    
    const result = await handleSendChallenge(challengeData, player, profile.name || "", profile.avatar || "", balance)
    
    if (result.success) {
      setShowChallengeModal(false)
      setSuccessMessage("challenge sent")
      setShowSuccessModal(true)

      loadPendingChallenges()
    } else {
      setErrorMessage("error sending challenge")
      setShowErrorModal(true)
    setChallangeError(result.message)
    }
  }
  
  // Handle selecting an opponent from the dropdown
  const onSelectOpponent = async (username: string, avatar: string) => {
    if (!player || !profile) return

    const result = await handleSelect(username, player, profile.name || "", profile.avatar || "")

    if (result.success && result.data) {
      setChallengeData({
        ...challengeData,
        player1: player,
        player1_name: profile.name,
        player1_avatar: profile.avatar,
        ...result.data,
      })

      setQuery(username)
      setShowDropdown(false)
      onSelectOpponentAvatar(avatar)
    }
  }
  
  // Handle canceling a challenge
  const setConfirmCancelChallenge = async () => {
    if (selectedChallenge) {
      let data:any = await handleCancelChallenge(selectedChallenge.game_id)
      if(data.success){
        setSuccessMessage("game canceled")
        setShowSuccessModal(true)
        loadPendingChallenges()
      
      }else{
        setErrorMessage("error canceling game")
        setShowErrorModal(true)
      
      }
      setShowCancelModal(false)
      setSelectedChallenge(null)
  
    }
  }

  const setConfirmAcceptChallenge = async () => {
    if (selectedChallenge) {
      let data:any = await handleAcceptChallenge(selectedChallenge.game_id,player,selectedChallenge.amount,selectedChallenge.money)
      if(data.success){
        setSuccessMessage(data.message)
        setShowSuccessModal(true)
        loadPendingChallenges()
      
      }else{
        setErrorMessage(data.message)
        setShowErrorModal(true)
      
      }
      setShowAcceptModal(false)
      setSelectedChallenge(null)
  
    }
  }

  const setConfirmRejectChallenge = async () => {
    if (selectedChallenge) {
      let data:any = await handleRejectChallenge(selectedChallenge.game_id)
      if(data.success){
        setSuccessMessage(data.message)
        setShowSuccessModal(true)
        loadPendingChallenges()
      
      }else{
        setErrorMessage(data.message)
        setShowErrorModal(true)
      
      }
      setShowCancelModal(false)
      setSelectedChallenge(null)
  
    }
  }
  
  const setSubmitScore = async (player1score: number, player2score: number) => {
    if (selectedChallenge) {
      let data:any = await handleReportScore(selectedChallenge.game_id,player,player1score,player2score)
      if(data.success){
        setSuccessMessage(data.message)
        setShowSuccessModal(true)
        loadPendingChallenges()
      
      }else{
        setErrorMessage(data.message)
        setShowErrorModal(true)
      
      }
      setShowReportScoreModal(false)
      setSelectedChallenge(null)
  
    }
  }
  
  const setConfirmScore = async () => {
    if (selectedChallenge) {
      let data:any = await handleConfirmScore(selectedChallenge.game_id)
      if(data.success){
        setSuccessMessage(data.message)
        setShowSuccessModal(true)
        loadPendingChallenges()
      
      }else{
        setErrorMessage(data.message)
        setShowErrorModal(true)
      
      }
      setShowConfirmScoreModal(false)
      setSelectedChallenge(null)
  
    }
  }
  
  
  const setDisputeScore = async () => {
    if (selectedChallenge) {
      let data:any = await handleDisputeScore(selectedChallenge.game_id)
      if(data.success){
        setSuccessMessage(data.message)
        setShowSuccessModal(true)
        loadPendingChallenges()
      
      }else{
        setErrorMessage(data.message)
        setShowErrorModal(true)
      
      }
      setShowDisputeScoreModal(false)
      setSelectedChallenge(null)
  
    }
  }

  const setMutualCancel = async () => {
    if (selectedChallenge) {
      let data:any = await handleMutualCancel(selectedChallenge.game_id,player)
      if(data.success){
        setSuccessMessage(data.message)
        setShowSuccessModal(true)
        loadPendingChallenges()
      
      }else{
        setErrorMessage(data.message)
        setShowErrorModal(true)
      
      }
      setShowMutualCancelModal(false)
      setSelectedChallenge(null)
  
    }
  }
  
  const openAcceptChallenge = (challenge: any) => {
    setSelectedChallenge(challenge)
    setShowAcceptModal(true)
  }
  const openCancelChallenge = (challenge: any) => {
    setSelectedChallenge(challenge)
    setShowCancelModal(true)
  }
  const openReportScore = (challenge: any) => {
    setSelectedChallenge(challenge)
    setShowReportScoreModal(true)
  }
  const openConfirmScore = (challenge: any) => {
    console.log(challenge)
    setSelectedChallenge(challenge)
    setShowConfirmScoreModal(true)
  }
  const openDisputeScore = (challenge: any) => {
    setSelectedChallenge(challenge)
    setShowDisputeScoreModal(true)
  }
  const openMutualCancel = (challenge: any) => {
    setSelectedChallenge(challenge)
    setShowMutualCancelModal(true)
  }


  
  // Handle opening a chat popup
  const handleOpenChat = (userId: string, userName: string, userAvatar: string) => {
    if (!openChats.some((chat) => chat.id === userId)) {
      setOpenChats([...openChats, { id: userId, name: userName, avatar: userAvatar }])
    }
  }
  
  // Handle closing a chat popup
  const handleCloseChat = (userId: string) => {
    setOpenChats(openChats.filter((chat) => chat.id !== userId))
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary neon-glow">Esports Arena</h1>
        
        
        <Tabs defaultValue="chat" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            {isAuthenticated && (
              <>
                <TabsTrigger value="chat" className="text-lg">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-lg" onClick={loadPendingChallenges}>
                  Pending
                </TabsTrigger>
                <TabsTrigger value="history" className="text-lg" onClick={loadGameHistory}>
                  History
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="tournaments" className="text-lg">
              Tournaments
            </TabsTrigger>
          </TabsList>
          
          {/* Chat Tab */}
          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chat Rooms */}
              <Card className="lg:col-span-1 bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Chat Rooms</CardTitle>
                  <CardDescription>Join or create a chat room</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="New Chat Room Name"
                        value={newChatRoomName}
                        onChange={(e) => setNewChatRoomName(e.target.value)}
                        className="flex-grow"
                      />
                      <Button
                        onClick={handleNewChatRoom}
                        className="shrink-0 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      >
                        Create
                      </Button>
                    </div>
                    <ScrollArea className="h-[400px]">
                      <ul className="space-y-2">
                        {chatRooms.map((room) => (
                          <li key={room.id}>
                            <Button
                              onClick={() => handleChatRoomSelect(room)}
                              variant={selectedChatRoom?.id === room.id ? "default" : "outline"}
                              className={`w-full justify-start ${selectedChatRoom?.id === room.id ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
                            >
                              {room.name}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              {/* Chat Messages */}
              <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">
                    Chat{" "}
                    {selectedChatRoom && (
                      <span className="ml-2 text-muted-foreground font-normal"> - {selectedChatRoom.name}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] mb-4" ref={scrollAreaRef}>
                    {selectedChatRoom ? (
                      <ul className="space-y-4">
                        {messages.map((message: any) => (
                          <li key={message.id} className="flex items-start space-x-2">
                            <div>
                              <p className="font-semibold">
                                <span
                                  className="text-primary cursor-pointer hover:underline"
                                  onClick={() =>
                                    handleOpenChat(message.sender, message.sender_name, message.sender_avatar)
                                  }
                                >
                                  {message.sender_name}
                                </span>
                                : {message.content}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-muted-foreground">Select a chat room to view messages.</p>
                    )}
                  </ScrollArea>

                  <div className="flex items-center w-full space-x-2">
                    <Input
                      placeholder={isAuthenticated ? "Type your message..." : "Connect wallet to chat"}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && isAuthenticated) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-grow"
                      disabled={!isAuthenticated}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {isAuthenticated && (
              <>
                <div className="mt-8">
                  <Button
                    onClick={() => setShowChallengeModal(true)}
                    className="bg-[#111] hover:bg-[#222] text-white border border-[#00FFA9] rounded-full relative overflow-hidden group w-full"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-50 transition-opacity"></span>
                    <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-transparent opacity-30 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                    <span className="relative">Send Challenge</span>
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Pending Challenges Tab */}
          <TabsContent value="pending">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Pending Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingChallenges.map((challenge: EsportsGame) => (
                      <Card
                        key={challenge.id}
                        className="bg-black/50 border-primary/30 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 z-0"></div>
                          <CardContent className="relative z-10 p-6">
                            <div className="flex items-center space-x-4 mb-4">
                              <Avatar className="w-16 h-16 border-2 border-primary">
                                <AvatarImage
                                  src={
                                    challenge.player1 === player
                                      ? challenge.player2_avatar || "/placeholder.svg?height=64&width=64"
                                      : challenge.player1_avatar || "/placeholder.svg?height=64&width=64"
                                  }
                                />
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {challenge.player1 === player
                                    ? challenge.player2_name?.charAt(0)
                                    : challenge.player1_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-lg font-bold text-primary">
                                  {challenge.player1 === player ? challenge.player2_name : challenge.player1_name}
                                </h3>
                                <div className="flex items-center space-x-2 text-sm text-primary/80">
                                  <Trophy className="w-4 h-4" />
                                  <span>
                                    {challenge.player1 === player
                                      ? `W:${challenge.player2_records?.wins || 0} - L:${challenge.player2_records?.losses || 0}`
                                      : `W:${challenge.player1_records?.wins || 0} - L:${challenge.player1_records?.losses || 0}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <Gamepad2 className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium text-primary">{challenge.game}</span>
                                </div>
                                <Badge variant="outline" className="text-primary border-primary">
                                  {challenge.console}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium text-primary">
                                    {`${Number.parseFloat(String(challenge.amount)).toLocaleString(undefined, {
                                      minimumFractionDigits: 6,
                                      maximumFractionDigits: 6,
                                    })}`}
                                    {challenge.money === 1 ? "SOL" : "GAMER"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-primary/70 mb-4">
                              <div className="flex items-center space-x-1">
                                <Zap className="w-3 h-3" />
                                <span>
                                  Win Streak:{" "}
                                  {challenge.player1 === player
                                    ? challenge.player2_records?.win_streak || 0
                                    : challenge.player1_records?.win_streak || 0}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Swords className="w-3 h-3" />
                                <span>
                                  Loss Streak:{" "}
                                  {challenge.player1 === player
                                    ? challenge.player2_records?.loss_streak || 0
                                    : challenge.player1_records?.loss_streak || 0}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {challenge.player2 === player && challenge.status === 1 && (
                                <Button
                                  className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black font-medium rounded-full"
                                  onClick={() => openAcceptChallenge(challenge)}
                                >
                                  Accept
                                </Button>
                              )}

                              {challenge.scoredby !== player && challenge.status === 3 && (
                                <Button
                                  className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black font-medium rounded-full"
                                  onClick={() => openConfirmScore(challenge)}
                                >
                                  Confirm Score
                                </Button>
                              )}

                              {challenge.player1 === player && challenge.status === 1 && (
                                <Button
                                  className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full"
                                  onClick={() => openCancelChallenge(challenge)}
                                >
                                  Cancel
                                </Button>
                              )}
                              
                              {challenge.status === 2 && (
                                <>
                                  <Button
                                    className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black font-medium rounded-full"
                                    onClick={() => openReportScore(challenge)}
                                  >
                                    Report Score
                                  </Button>
                                  <Button
                                    className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full"
                                    onClick={() => openMutualCancel(challenge)}
                                  >
                                    Mutual Cancel
                                  </Button>
                                </>
                              )}

                              {challenge.status === 6 && (
                                <Button
                                  className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full"
                                  onClick={() => openMutualCancel(challenge)}
                                >
                                  Mutual Cancel
                                </Button>
                              )}

                              {challenge.scoredby === player && challenge.status === 3 && (
                                <Button variant="outline" className="bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 text-white rounded-full">
                                  Pending Score Confirm
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                className="bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 text-white rounded-full"
                                onClick={() =>
                                  handleOpenChat(
                                    challenge.player1 === player ? challenge.player2 : challenge.player1,
                                    challenge.player1 === player ? challenge.player2_name : challenge.player1_name,
                                    challenge.player1 === player ? challenge.player2_avatar : challenge.player1_avatar,
                                  )
                                }
                              >
                                <MessageSquare className="w-4 h-4 mr-2" /> Chat
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-2xl font-bold text-primary mb-4">No Pending Challenges</p>
                    <p className="text-muted-foreground mb-8">Ready to prove your skills? Challenge someone now!</p>
                    <Button
                      className="font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
                    >
                      Find Opponents
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Game History</CardTitle>
              </CardHeader>
              <CardContent>
                {gameHistory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gameHistory.map((game: any) => (
                      <Card
                        key={game.id}
                        className="bg-black/50 border-primary/30 overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <Badge
                              className={
                                (game.player1 === player && game.player1score > game.player2score) ||
                                (game.player2 === player && game.player2score > game.player1score)
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }
                            >
                              {(game.player1 === player && game.player1score > game.player2score) ||
                              (game.player2 === player && game.player2score > game.player1score)
                                ? "WON"
                                : "LOST"}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {new Date(game.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold mb-2">{game.game}</h3>
                          <p className="text-sm text-gray-400 mb-4">Console: {game.console}</p>

                          <div className="flex justify-between items-center mb-4 bg-black/30 p-3 rounded-lg">
                            <div className="text-center">
                              <p className="text-sm">{game.player1_name || "Player 1"}</p>
                              <p className="text-xl font-bold text-primary">{game.player1score}</p>
                            </div>
                            <div className="text-sm text-gray-400">VS</div>
                            <div className="text-center">
                              <p className="text-sm">{game.player2_name || "Player 2"}</p>
                              <p className="text-xl font-bold text-primary">{game.player2score}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-400">
                              Amount:{" "}
                              {Number.parseFloat(String(game.amount)).toLocaleString(undefined, {
                                minimumFractionDigits: 6,
                                maximumFractionDigits: 6,
                              })}{" "}
                              {game.money === 1 ? "SOL" : "GAMER"}
                            </p>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" /> Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No game history available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* This would be populated with real tournament data from Supabase */}
                  <Card className="bg-black/50 border-primary/30 overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                    <div className="relative">
                      <img
                        src="/placeholder.svg?height=200&width=400"
                        alt="Tournament"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-[#00FFA9] text-black">LIVE</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold mb-1">Cyber Showdown</h3>
                      <p className="text-sm text-gray-400 mb-3">FPS Arena</p>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Prize Pool</p>
                          <p className="font-bold">$10,000</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Players</p>
                          <p className="font-bold">128/128</p>
                        </div>
                      </div>
                      
                      <Button className="w-full">View Details</Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/50 border-primary/30 overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                    <div className="relative">
                      <img
                        src="/placeholder.svg?height=200&width=400"
                        alt="Tournament"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-[#FF007A] text-white">REGISTERING</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold mb-1">Strategy Masters</h3>
                      <p className="text-sm text-gray-400 mb-3">Strategy</p>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Prize Pool</p>
                          <p className="font-bold">$15,000</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Players</p>
                          <p className="font-bold">48/64</p>
                        </div>
                      </div>

                      <Button className="w-full" glowColor="from-pink-500 to-purple-500">
                        Register Now
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/50 border-primary/30 overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                    <div className="relative">
                      <img
                        src="/placeholder.svg?height=200&width=400"
                        alt="Tournament"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-[#FFD600] text-black">UPCOMING</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold mb-1">Speed Demons</h3>
                      <p className="text-sm text-gray-400 mb-3">Racing</p>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Prize Pool</p>
                          <p className="font-bold">$5,000</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Starts In</p>
                          <p className="font-bold">2d 12h</p>
                        </div>
                      </div>

                      <Button className="w-full" glowColor="from-yellow-500 to-amber-500">
                        Remind Me
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <HowItWorksSection />

        {/* Profile Update Modal */}
        {/* <ProfileUpdateModal
          open={showUserNameModal}
          onOpenChange={setShowUserNameModal}
          userData={userData}
          setUserData={setUserData}
          player={player || ""}
          onSuccess={() => {
            // Refresh user data after update
            loadPendingChallenges()
            loadGameHistory()
          }}
        /> */}
        
        {/* Challenge Modal */}
        <EsportsChallengeModal
          isOpen={showChallengeModal}
          onClose={() => setShowChallengeModal(false)}
          onSendChallenge={onSendChallenge}
          challengeData={challengeData}
          setChallengeData={setChallengeData}
          query={query}
          setQuery={setQuery}
          suggestions={suggestions}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onSelectOpponent={onSelectOpponent}
          availableGames={availableGames}
          opponentAvatar={opponentAvatar}
          challengeError={challengeError}
          setChallengeError={setChallangeError}
        />
                    {selectedChallenge && (
              <>
                <ChallengeCancelModal
                  isOpen={showCancelModal}
                  onClose={() => setShowCancelModal(false)}
                  onConfirm={setConfirmCancelChallenge}
                  challengeDetails={selectedChallenge}
                />
                
                <ChallengeAcceptModal
                  isOpen={showAcceptModal}
                  onClose={() => setShowAcceptModal(false)}
                  onConfirm={setConfirmAcceptChallenge}
                  onReject={setConfirmRejectChallenge}
                  challengeDetails={selectedChallenge}
                />
                <ChallengeScoreModal
                  isOpen={showReportScoreModal}
                  onClose={() => setShowReportScoreModal(false)}
                  onSubmit={setSubmitScore}
                  player1Name={selectedChallenge?.player1_name || "Player 1"}
                  player2Name={selectedChallenge?.player2_name || "Player 2"}
                  isTournamentMatch={false}
                />
                <ChallengeConfirmScoreModal
                  isOpen={showConfirmScoreModal}
                  onClose={() => setShowConfirmScoreModal(false)}
                  onConfirm={setConfirmScore}
                  onDispute={() => {
                    setShowConfirmScoreModal(false)
                    setShowDisputeScoreModal(true)
                  }}
                  player1Name={selectedChallenge?.player1_name}
                  player2Name={selectedChallenge?.player2_name}
                  initialPlayer1Score={selectedChallenge?.player1score}
                  initialPlayer2Score={selectedChallenge?.player2score}
                  isScoring={false}
                />

                <ChallengeDisputeScoreModal
                  isOpen={showDisputeScoreModal}
                  onClose={() => setShowDisputeScoreModal(false)}
                  onSubmit={setDisputeScore}
                  player1Name={selectedChallenge?.player1?.username || "Player 1"}
                  player2Name={selectedChallenge?.player2?.username || "Player 2"}
                  initialPlayer1Score={selectedChallenge?.player1score || 0}
                  initialPlayer2Score={selectedChallenge?.player2score || 0}
                />
                
                <ChallengeMutualCancelModal
                  isOpen={showMutualCancelModal}
                  onClose={() => setShowMutualCancelModal(false)}
                  onConfirm={setMutualCancel}
                  publicKey={player || ""}
                />
              </>
            )}
        {showSuccessModal && (
          <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
        )}
        {showErrorModal && (
          <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
        )}
        {/* Chat Popups */}
        <div className="fixed bottom-4 right-4 flex flex-row-reverse gap-4">
          {openChats.map((chat) => (
            <ChatPopup
              key={chat.id}
              senderId={player || ""}
              receiverId={chat.id}
              receiverName={chat.name}
              receiverAvatar={chat.avatar}
              onClose={() => handleCloseChat(chat.id)}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

