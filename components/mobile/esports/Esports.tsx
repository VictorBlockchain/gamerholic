"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { ProfileUpdateModal, type UserData } from "@/components/modals/profile-update-modal"
import { ChatPopup } from "@/components/chat-popup"
import { EsportsChallengeModal } from "@/components/modals/challenge-send-modal"
import {
  Trophy,
  Users,
  Zap,
  Info,
  Wallet,
  MessageSquare,
  Send,
  Check,
  Gamepad2,
  ThumbsUp,
  DollarSign,
  ExternalLink,
} from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { useMobile } from "@/hooks/use-mobile"
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

import { ChallengeCancelModal } from "@/components/modals/challenge-cancel-modal"
import { ChallengeAcceptModal } from "@/components/modals/challenge-accept-modal"
import { ChallengeScoreModal } from "@/components/modals/challenge-score-modal"
import { ChallengeConfirmScoreModal } from "@/components/modals/challenge-confirm-score-modal"
import { ChallengeDisputeScoreModal } from "@/components/modals/challenge-dispute-score-modal"
import { ChallengeMutualCancelModal } from "@/components/modals/challenge-mutual-cancel-modal"
import { SuccessModal } from "@/components/modals/success-modal"
import { ErrorModal } from "@/components/modals/error-modal"
// News ticker items
const NEWS_ITEMS = [
  { id: 1, text: "LIVE NOW: Cyber Showdown Finals - Team Alpha vs Team Omega", link: "#" },
  { id: 2, text: "Registration open for the Spring Championship - $25,000 prize pool", link: "#" },
  { id: 3, text: "New tournament format announced for the upcoming season", link: "#" },
  { id: 4, text: "Team Phoenix looking for new players - tryouts this weekend", link: "#" },
]

// Helper component for the "How It Works" section
const HowItWorksMobile = () => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 mt-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-indigo-600/5 z-0"></div>
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl text-primary flex items-center">
          <Info className="w-4 h-4 mr-2" /> How It Works
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <ol className="space-y-3">
          {[
            { icon: Wallet, text: "Deposit Solana into your deposit wallet", color: "text-green-400" },
            {
              icon: MessageSquare,
              text: "Communicate with your opponent in the chatroom",
              color: "text-blue-400",
            },
            {
              icon: Send,
              text: "Send challenge to your opponent",
              color: "text-purple-400",
            },
            { icon: Check, text: "Your opponent must accept the challenge", color: "text-cyan-400" },
            { icon: Gamepad2, text: "Play your game and report the score", color: "text-pink-400" },
            { icon: ThumbsUp, text: "Confirm the score", color: "text-yellow-400" },
          ].map((step, index) => (
            <li key={index} className="flex items-start group">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold mr-2 text-xs transition-transform duration-300 group-hover:scale-110">
                {index + 1}
              </span>
              <div className="flex items-center">
                <step.icon className={`w-4 h-4 mr-2 ${step.color}`} />
                <span className="text-sm group-hover:text-white transition-colors duration-300">{step.text}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 p-3 bg-black/30 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground">
            Funds are transferred from the losing player's wallet to the winner. You will not be able to withdraw funds
            from your deposit wallet while you have an active esports game.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function EsportsMobile() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, player, profile, balance } = useUser()
  const isMobile = useMobile()

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
  const [openChats, setOpenChats] = useState<{ id: string; name: string; avatar: string }[]>([])
  const [challengeError, setChallengeError] = useState("")
  
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
      toast({
        title: "Success",
        description: result.message,
      })
      setShowChallengeModal(false)
      loadPendingChallenges()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
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
    }
  }

  // Handle canceling a challenge
  const setConfirmCancelChallenge = async () => {
    if (selectedChallenge) {
      let data:any = await handleCancelChallenge(selectedChallenge.id)
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
  
  const setSubmitScore = async () => {
    if (selectedChallenge) {
      let data:any = await handleReportScore(selectedChallenge.game_id,player,selectedChallenge.player1score,selectedChallenge.player2score)
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
    <>
      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-4 relative z-10">
        {/* Hero Section */}
        <section className="mb-8">
          <ScrollReveal>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/20 text-[#FF007A] text-sm mb-4">
              <Trophy className="w-4 h-4 mr-2" />
              ESPORTS
            </div>
            <h1 className="text-2xl font-bold mb-2">Live Competitions</h1>
            <p className="text-gray-400 text-sm mb-4">Watch, compete, and earn in professional tournaments</p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-full bg-[#00FFA9]/20 flex items-center justify-center mb-2">
                    <Trophy className="w-4 h-4 text-[#00FFA9]" />
                  </div>
                  <p className="text-xs text-gray-400">LIVE</p>
                  <p className="text-xl font-bold">
                    <AnimatedCounter end={8} />
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF007A]/20 flex items-center justify-center mb-2">
                    <Users className="w-4 h-4 text-[#FF007A]" />
                  </div>
                  <p className="text-xs text-gray-400">VIEWERS</p>
                  <p className="text-xl font-bold">
                    <AnimatedCounter end={24.5} suffix="k" formatFn={(value) => value.toFixed(1)} />
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFD600]/20 flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4 text-[#FFD600]" />
                  </div>
                  <p className="text-xs text-gray-400">PRIZE POOL</p>
                  <p className="text-xl font-bold">
                    <AnimatedCounter end={250} prefix="$" suffix="k" />
                  </p>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </section>

        {/* Tabs */}
        <section className="mb-6">
          <ScrollReveal>
            <Tabs defaultValue="chat" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-[#111] border border-[#333] rounded-full p-1">
                {isAuthenticated && (
                  <>
                    <TabsTrigger
                      value="chat"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                    >
                      Chat
                    </TabsTrigger>
                    <TabsTrigger
                      value="pending"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                      onClick={loadPendingChallenges}
                    >
                      Pending
                    </TabsTrigger>
                    <TabsTrigger
                      onClick={loadGameHistory}
                      value="history"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                    >
                      History
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger
                  value="tournaments"
                  className={`rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1 ${!isAuthenticated ? "col-span-4" : ""}`}
                >
                  Tournaments
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </ScrollReveal>
        </section>

        {/* Tab Content */}
        {activeTab === "chat" && (
          <section>
            <ScrollReveal>
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20 mb-4">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg text-primary">Chat Rooms</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="New Chat Room Name"
                        value={newChatRoomName}
                        onChange={(e) => setNewChatRoomName(e.target.value)}
                        className="flex-grow"
                        disabled={!isAuthenticated}
                      />
                      <Button
                        onClick={handleNewChatRoom}
                        className="shrink-0 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                        disabled={!isAuthenticated}
                      >
                        Create
                      </Button>
                    </div>
                    <ScrollArea className="h-[150px]">
                      <ul className="space-y-2">
                        {chatRooms.map((room) => (
                          <li key={room.id}>
                            <Button
                              onClick={() => handleChatRoomSelect(room)}
                              variant={selectedChatRoom?.id === room.id ? "default" : "outline"}
                              className={`w-full justify-start text-sm ${selectedChatRoom?.id === room.id ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
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
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20 mb-4">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg text-primary">
                    {selectedChatRoom ? selectedChatRoom.name : "Select a chat room"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ScrollArea className="h-[300px] mb-4" ref={scrollAreaRef}>
                    {selectedChatRoom ? (
                      <ul className="space-y-3">
                        {messages.map((message: any) => (
                          <li key={message.id} className="flex items-start space-x-2">
                            {/* <Avatar className="h-7 w-7">
                              <AvatarImage src={message.sender_avatar || "/placeholder.svg?height=28&width=28"} />
                              <AvatarFallback>{message.sender_name?.charAt(0)}</AvatarFallback>
                            </Avatar> */}
                            <div>
                              <p className="text-sm">
                                <span className="text-primary font-medium">{message.sender_name}</span>:{" "}
                                {message.content}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-muted-foreground text-sm">Select a chat room to view messages.</p>
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
                      disabled={!isAuthenticated || !selectedChatRoom}
                    />
                    {/* <Button
                      onClick={handleSendMessage}
                      size="sm"
                      disabled={!isAuthenticated || !selectedChatRoom}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <Send className="w-3 h-3 mr-1" /> Send
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

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
          </section>
        )}

        {/* Pending Challenges Tab */}
        {activeTab === "pending" && (
          <section>
            <ScrollReveal>
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg text-primary">Pending Challenges</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {pendingChallenges.length > 0 ? (
                    <div className="space-y-4">
                      {pendingChallenges.map((challenge: any) => (
                        <Card key={challenge.id} className="bg-black/50 border-primary/30 overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <Avatar className="h-10 w-10 border border-primary">
                                <AvatarImage
                                  src={
                                    challenge.player1 === player
                                      ? challenge.player2_avatar || "/placeholder.svg?height=40&width=40"
                                      : challenge.player1_avatar || "/placeholder.svg?height=40&width=40"
                                  }
                                />
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {challenge.player1 === player
                                    ? challenge.player2_name?.charAt(0)
                                    : challenge.player1_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-sm font-bold text-primary">
                                  {challenge.player1 === player ? challenge.player2_name : challenge.player1_name}
                                </h3>
                                <div className="flex items-center text-xs text-primary/80">
                                  <Trophy className="w-3 h-3 mr-1" />
                                  <span>
                                    {challenge.game} ({challenge.console})
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs mb-3">
                              <div className="flex items-center">
                                <DollarSign className="w-3 h-3 mr-1 text-primary" />
                                <span className="text-primary">
                                  {Number.parseFloat(String(challenge.amount)).toLocaleString(undefined, {
                                    minimumFractionDigits: 6,
                                    maximumFractionDigits: 6,
                                  })}{" "}
                                  {challenge.money === 1 ? "SOL" : "GAMER"}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs border-primary text-primary">
                                {challenge.status === 1
                                  ? "PENDING"
                                  : challenge.status === 2
                                    ? "ACCEPTED"
                                    : challenge.status === 3
                                      ? "SCORED"
                                      : challenge.status === 4
                                        ? "CONFIRMED"
                                        : challenge.status === 5
                                          ? "DISPUTED"
                                          : "CANCELLATION REQUESTED"}
                              </Badge>
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
                                  variant="destructive"
                                  className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full"
                                  onClick={() => openCancelChallenge(challenge)}
                                >
                                  Cancel
                                </Button>
                              )}

                              {challenge.status === 2 && (
                                <>
                                  <Button
                                    className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full"
                                    onClick={() => openReportScore(challenge)}
                                  >
                                    Report
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
                                size="sm"
                                className="bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 text-white rounded-full"
                                onClick={() =>
                                  handleOpenChat(
                                    challenge.player1 === player ? challenge.player2 : challenge.player1,
                                    challenge.player1 === player ? challenge.player2_name : challenge.player1_name,
                                    challenge.player1 === player ? challenge.player2_avatar : challenge.player1_avatar,
                                  )
                                }
                              >
                                <MessageSquare className="w-3 h-3 mr-1" /> Chat
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-lg font-bold text-primary mb-2">No Pending Challenges</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Ready to prove your skills? Challenge someone now!
                      </p>
                      <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white">
                        Find Opponents
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </section>
        )}

        {/* Game History Tab */}
        {activeTab === "history" && (
          <section>
            <ScrollReveal>
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg text-primary">Game History</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {gameHistory.length > 0 ? (
                    <div className="space-y-4">
                      {gameHistory.map((game: any) => (
                        <Card key={game.id} className="bg-black/50 border-primary/30 overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-3">
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
                              <span className="text-xs text-gray-400">
                                {new Date(game.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold mb-1">{game.game}</h3>
                            <p className="text-xs text-gray-400 mb-3">Console: {game.console}</p>

                            <div className="flex justify-between items-center mb-3 bg-black/30 p-2 rounded-lg">
                              <div className="text-center">
                                <p className="text-xs">{game.player1_name || "Player 1"}</p>
                                <p className="text-lg font-bold text-primary">{game.player1score}</p>
                              </div>
                              <div className="text-xs text-gray-400">VS</div>
                              <div className="text-center">
                                <p className="text-xs">{game.player2_name || "Player 2"}</p>
                                <p className="text-lg font-bold text-primary">{game.player2score}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-400">
                                Amount:{" "}
                                {Number.parseFloat(String(game.amount)).toLocaleString(undefined, {
                                  minimumFractionDigits: 6,
                                  maximumFractionDigits: 6,
                                })}{" "}
                                {game.money === 1 ? "SOL" : "GAMER"}
                              </p>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                <ExternalLink className="w-3 h-3 mr-1" /> Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No game history available.</p>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </section>
        )}

        {/* Tournaments Tab */}
        {activeTab === "tournaments" && (
          <section>
            <ScrollReveal>
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg text-primary">Tournaments</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-4">
                    {/* This would be populated with real tournament data from Supabase */}
                    <Card className="bg-black/50 border-primary/30 overflow-hidden">
                      <div className="relative">
                        <img
                          src="/placeholder.svg?height=150&width=300"
                          alt="Tournament"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-[#00FFA9] text-black text-xs">LIVE</Badge>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="text-sm font-bold mb-1">Cyber Showdown</h3>
                        <p className="text-xs text-gray-400 mb-2">FPS Arena</p>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-black/30 p-2 rounded">
                            <p className="text-xs text-gray-400">Prize Pool</p>
                            <p className="text-sm font-bold">$10,000</p>
                          </div>
                          <div className="bg-black/30 p-2 rounded">
                            <p className="text-xs text-gray-400">Players</p>
                            <p className="text-sm font-bold">128/128</p>
                          </div>
                        </div>

                        <Button className="w-full text-xs h-8">View Details</Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/50 border-primary/30 overflow-hidden">
                      <div className="relative">
                        <img
                          src="/placeholder.svg?height=150&width=300"
                          alt="Tournament"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-[#FF007A] text-white text-xs">REGISTERING</Badge>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="text-sm font-bold mb-1">Strategy Masters</h3>
                        <p className="text-xs text-gray-400 mb-2">Strategy</p>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-black/30 p-2 rounded">
                            <p className="text-xs text-gray-400">Prize Pool</p>
                            <p className="text-sm font-bold">$15,000</p>
                          </div>
                          <div className="bg-black/30 p-2 rounded">
                            <p className="text-xs text-gray-400">Players</p>
                            <p className="text-sm font-bold">48/64</p>
                          </div>
                        </div>

                        <Button className="w-full text-xs h-8">
                          Register Now
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </section>
        )}

        <HowItWorksMobile />

        {/* Profile Update Modal */}
        <ProfileUpdateModal
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
        />

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
          challengeError={challengeError}
          setChallengeError={setChallengeError}
        />
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
        {/* Chat Popups */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-4">
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
    </>
  )
}

