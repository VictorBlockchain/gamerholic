"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useWallet } from "@solana/wallet-adapter-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { generateDepositWallet } from "@/lib/platformWallet"
import { Upload } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Zap, ChevronUp, ChevronDown, Swords, Gamepad, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SuccessModal } from "@/components/success-modal"
import { ErrorModal } from "@/components/error-modal"
import { CancelChallengeModal } from "@/components/cancel-challenge-modal"
import { AcceptChallengeModal } from "@/components/accept-challenge-modal"
import { ReportScoreModal } from "@/components/report-score-modal"
import { ConfirmScoreModal } from "@/components/confirm-score-modal"
import { DisputeScoreModal } from "@/components/dispute-score-modal"
import { MutualCancelModal } from "@/components/mutual-cancel-modal"
import { balanceManager } from "@/lib/balances"
import { TournamentForm } from "@/components/tournament-form"
import { TournamentList } from "@/components/tournament-list"
import {
  Info,
  Wallet,
  MessageSquare,
  Send,
  Check,
  GamepadIcon as GameController,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react"
// Add this import at the top of the file
import { ChatPopup } from "@/components/chat-popup"
const solana = new balanceManager()
const GAMER = process.env.NEXT_PUBLIC_GAMERHOLIC
// Define types for chat messages, chatrooms, and esports challenges
interface ChatMessage {
  id: string
  chatroom_id: string
  sender_id: string
  sender_name: string
  sender_public_key: string
  sender_avatar: string
  content: string
  created_at: string
}

interface ChatRoom {
  id: string
  name: string
  created_at: string
}

interface EsportsChallenge {
  id: string
  game: string
  console: string
  amount: number
  money: number
  rules: string
  player1: string
  player2: string
  player1score: number | null
  player2score: number | null
  status: number
  scoredby: string | null
  indisupte: boolean | null
  referee: string | null
}

interface UserEsportsProfile {
  username: string
  avatarUrl: string
  winLossRecord: Record<string, { wins: number; losses: number }>
  amountWon: number
  amountLost: number
  winStreak: number
  lossStreak: number
}

interface User {
  id: string
  username: string
  avatar_url: string
  deposit_wallet: string
  balance_sol: number
  balance_gamer: number
}

//status
//1 = challenge sent
//2 = accepted
//3 = scored
//4 = score accepted
//5 = disputed
//6 = mutual cancel requested
//7 = mutual cancel accepted
//8 = dispute resolved
//9 = completed

// Add this new component after the existing imports and before the EsportsPage component
const HowItWorksSection = () => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 mt-8">
      <CardHeader>
        <CardTitle className="text-2xl text-primary flex items-center">
          <Info className="mr-2" /> How It Works
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {[
            { icon: Wallet, text: "Deposit Solana into your deposit wallet" },
            {
              icon: MessageSquare,
              text: "Communicate with your opponent in the chatroom and agree to the rules of your match",
            },
            {
              icon: Send,
              text: "Send challenge to your opponent (you must both have the game amount + 5% service fee in your deposit wallet)",
            },
            { icon: Check, text: "Your opponent must accept the challenge" },
            { icon: GameController, text: "Play your game and report the score" },
            { icon: ThumbsUp, text: "Confirm the score" },
          ].map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold mr-3">
                {index + 1}
              </span>
              <div className="flex items-center">
                <step.icon className="w-5 h-5 mr-2 text-primary" />
                <span>{step.text}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 text-sm text-muted-foreground">
          Funds are transferred from the losing player's wallet to the winner. You will not be able to withdraw funds
          from your deposit wallet while you have an active esports game.
        </div>
        <div className="mt-4 flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500 flex-shrink-0" />
          <p className="text-sm">
            Disputes require video evidence. If you lose 3 disputes within 7 days, you will be banned from the platform.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

const EsportsPage: React.FC = () => {
  const { publicKey }: any = useWallet()
  const { toast } = useToast()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null)
  const [newChatRoomName, setNewChatRoomName] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [pendingChallenges, setPendingChallenges] = useState<EsportsChallenge[]>([])
  const [gameHistory, setGameHistory] = useState<EsportsChallenge[]>([])
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [challengeData, setChallengeData]: any = useState<Partial<EsportsChallenge>>({})
  const [userData, setUserData]: any = useState<Partial<User>>({})
  // Add this state variable inside the EsportsPage component
  const [activeChats, setActiveChats] = useState<{
    [key: string]: { name: string; avatar: string }
  }>({})

  const [availableGames, setAvailableGames] = useState([])
  const [userProfiles, setUserProfiles] = useState<Record<string, UserEsportsProfile>>({})
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [oneOnOneMessages, setOneOnOneMessages] = useState<Record<string, ChatMessage[]>>({})
  const [newOneOnOneMessage, setNewOneOnOneMessage] = useState("")
  const [showUserNameModal, setShowUserNameModal] = useState(false)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [avatarFile, setAvatarFile]: any = useState("")
  const [user_id, setUserId]: any = useState("")
  const [user_name, setUserName]: any = useState("")
  const [user_avater, setUserAvatar]: any = useState("")

  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  const [selectedChallenge, setSelectedChallenge]: any = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showReportScoreModal, setShowReportScoreModal] = useState(false)
  const [esportsRecords, setEsportsRecords] = useState([])
  const [showConfirmScoreModal, setShowConfirmScoreModal] = useState(false)
  const [showDisputeScoreModal, setShowDisputeScoreModal] = useState(false)
  const [showMutualCancelModal, setShowMutualCancelModal] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const popularGames: any = [
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
  ]
  popularGames.sort((a:any, b:any) => a.localeCompare(b));

  useEffect(() => {
    if (publicKey) {
      fetchChatRooms()
      fetchPendingChallenges()
      fetchGameHistory()
      fetchAvailableGames()
      fetchUser()
    }
  }, [publicKey])
  const isFetching = false
  
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

  //auto complete
  useEffect(() => {
    const fetchUsers = async () => {
      if (query.length === 0) {
        setSuggestions([])
        return
      }

      const { data, error }: any = await supabase.from("users").select("username").ilike("username", `%${query}%`)

      if (error) {
        console.error("Error fetching users:", error)
      } else {
        console.log(data)
        setSuggestions(data.filter((user: any) => user.username !== user_name))
        setShowDropdown(true)
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchUsers()
    }, 300) // debounce for 300ms

    return () => clearTimeout(delayDebounceFn)
  }, [query, user_name]) // Added user_name to dependencies

  const handleSuccessNotification = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessModal(true)
  }

  const handleErrorNotification = (message: string) => {
    setErrorMessage(message)
    setShowErrorModal(true)
  }

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
            id: data.id,
            username: data.username,
            deposit_wallet: data.deposit_wallet,
            avatar_url: data.avatar_url,
            balance_sol: data.solana,
            balance_gamer: data.gamer || 0,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const fetchEsportsRecords = async () => {
    const { data, error }: any = await supabase.from("esports_records").select("*").eq("user_id", user_id)

    if (error) {
      console.error("Error fetching esports records:", error)
    } else {
      setEsportsRecords(data)
    }
  }

  const handleSetUserName = async () => {
    const name = userData.name

    const data_wallet: any = await generateDepositWallet(publicKey)
    if (data_wallet.success) {
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
    } else {
      handleErrorNotification("theres an error " + data_wallet.message)
    }
  }
  const fetchChatRooms = async () => {
    const { data, error } = await supabase.from("chat_rooms").select("*")
    if (error) {
      console.error("Error fetching chat rooms:", error)
      toast({
        title: "Failed to fetch chatrooms",
        description: "An error occurred while fetching chatrooms.",
        variant: "destructive",
      })
    } else {
      setChatRooms(data || [])
    }
  }

  const handleChatRoomSelect = (chatRoom: ChatRoom) => {
    setSelectedChatRoom(chatRoom)
    fetchMessages(chatRoom.id)
  }

  // Update the fetchMessages function to include the sender's avatar
  const fetchMessages = async (chatRoomId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*, users:sender_public_key(avatar_url)")
      .eq("chatroom_id", chatRoomId)
      .order("created_at", { ascending: true })
    if (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Failed to fetch messages",
        description: "An error occurred while fetching messages.",
        variant: "destructive",
      })
    } else {
      setMessages(
        data.map((message) => ({
          ...message,
          sender_avatar: message.users?.avatar_url,
        })) || [],
      )
    }
  }

  const handleNewChatRoom = async () => {
    if (newChatRoomName.trim() === "") return

    const { data, error } = await supabase.from("chat_rooms").insert({ name: newChatRoomName }).select()
    if (error) {
      console.error("Error creating chat room:", error)
      toast({
        title: "Failed to create chatroom",
        description: "An error occurred while creating the chatroom.",
        variant: "destructive",
      })
    } else {
      setChatRooms((prev) => [...prev, data[0]])
      setNewChatRoomName("")
    }
  }

  const handleSendMessage = async () => {
    if(!selectedChatRoom){
      setErrorMessage("select room to chat in")
      setShowErrorModal(true)

    }
    if (newMessage.trim() === "" || !selectedChatRoom) return
    let pass = 1
    const { data:banData, error:banError }: any = await supabase.from("chatroom_ban").select("*")
    .eq("public_key", publicKey)
    .eq("status", 1)
    .maybeSingle()
    
    
    if(banData){
      setErrorMessage("your are banned from chatting")
      setShowErrorModal(true)
      pass = 0
      // return
    
    }

    const linkRegex = /(https?:\/\/[^\s]+)/g
    const codeRegex = /(<script>|<\/script>|javascript:|on\w+\s*=)/gi
    if (linkRegex.test(newMessage) || codeRegex.test(newMessage)) {
      setErrorMessage("links not permitted")
      setShowErrorModal(true)
      pass = 0
      // return
    }
    
    if(pass>0){
    
      const { error } = await supabase.from("chat_messages").insert({
        chatroom_id: selectedChatRoom.id,
        sender_id: user_id,
        sender_name: user_name,
        sender_public_key: publicKey,
        sender_avatar: user_avater,
        content: newMessage,
      })
      if (error) {
        console.error("Error sending message:", error)
        toast({
          title: "Failed to send message",
          description: "An error occurred while sending the message.",
          variant: "destructive",
        })
      } else {
        setNewMessage("")
        fetchMessages(selectedChatRoom.id)
      }
    }
  
  }

  const fetchPendingChallenges = async () => {
    const { data, error } = await supabase
      .from("esports")
      .select("*")
      .or(`player1.eq.${publicKey.toString()},player2.eq.${publicKey.toString()}`)
      .in("status", [1, 2, 3, 4, 5, 6])

    if (error) {
      console.error("Error fetching pending challenges:", error)
      toast({
        title: "Failed to fetch pending challenges",
        description: "An error occurred while fetching pending challenges.",
        variant: "destructive",
      })
    } else {
      console.log(data)
      setPendingChallenges(data || [])
    }
  }

  const fetchGameHistory = async () => {
    const { data, error } = await supabase
      .from("esports")
      .select("*")
      .or(`player1.eq.${publicKey!.toString()},player2.eq.${publicKey!.toString()}`)
      .eq("status", 4) // Status 4 represents completed games

    if (error) {
      console.error("Error fetching game history:", error)
      toast({
        title: "Failed to fetch game history",
        description: "An error occurred while fetching game history.",
        variant: "destructive",
      })
    } else {
      setGameHistory(data || [])
    }
  }

  const handleSendChallenge = async () => {
    if (
      !challengeData.player2 ||
      !challengeData.game ||
      !challengeData.console ||
      (!challengeData.amount && challengeData.amount != 0) ||
      !challengeData.rules
    ) {
      let message: any
      if (!challengeData.player2) {
        message = "who's your opponent?"
      } else if (!challengeData.game) {
        message = "what game?"
      } else if (!challengeData.console) {
        message = "what console?"
      }else if(!challengeData.money){
        message = "are you playing for solana or gamer?"
      } else if (!challengeData.amount && challengeData.amount != 0) {
        message = "how mach in GAME tokens is this game for?"
      } else if (!challengeData.rules) {
        message = "what are the rules of this game?"
      }
      setShowErrorModal(true)
      setErrorMessage(message)
      console.log(
        challengeData.player2,
        challengeData.game,
        challengeData.console,
        challengeData.amount,
        challengeData.money,
        challengeData.rules,
      )
      return
    }
    
    //check user balance
    let result  = await solana.getBalance(userData.deposit_wallet)
    let balance_sol = result.solana
    let balance_gamer = result.gamer
    let balance = 0
    if(challengeData.money==1){
        balance = balance_sol
    }else{
        balance = balance_gamer
    }
    const gameAmount = (challengeData.amount / 10 ** 9) * 1.03
    const feeAmount = (challengeData.amount / 10 ** 9) * 0.03
    challengeData.fee = feeAmount
    balance = balance / 10 ** 9
    if (balance >= gameAmount) {
      const { error } = await supabase.from("esports").insert({
        ...challengeData,
        player1: publicKey!.toString(),
        status: 1, // Initial status for a new challenge
      })
      
      if (error) {
        console.error("Error sending challenge:", error)
        setShowErrorModal(true)
        setErrorMessage("An error occurred while sending the challenge.")
      } else {
        setShowSuccessModal(true)
        setSuccessMessage("Your challenge has been sent successfully.")

        setShowChallengeModal(false)
        fetchPendingChallenges()
      }
    } else {
      setErrorMessage("deposit more funds to send this challenge")
      setShowErrorModal(true)
    }
  }

  const handleSelect = async (username: any) => {
    // console.log(username)
    const { data, error }: any = await supabase
      .from("users")
      .select("publicKey, avatar_url, username")
      .eq("username", username)
      .single()
    
    setChallengeData({
      ...challengeData,
      player1: publicKey,
      player1_name: user_name,
      player1_avatar: user_avater,
      player2: data.publicKey,
      player2_name: username,
      player2_avatar: data.avatar_url,
    })
    setQuery(username)
    setShowDropdown(false)
  }

  const handleCancelChallenge = (challenge: any) => {
    setSelectedChallenge(challenge)
    setShowCancelModal(true)
  }

  // Replace the existing handleUserClick function with this new one
  const handleUserClick = (userId: string, userName: string, userAvatar: string) => {
    setActiveChats((prev) => ({
      ...prev,
      [userId]: { name: userName, avatar: userAvatar },
    }))
  }

  // Add this function to close chat windows
  const handleCloseChat = (userId: string) => {
    setActiveChats((prev) => {
      const newActiveChats = { ...prev }
      delete newActiveChats[userId]
      return newActiveChats
    })
  }

  const handleAcceptChallenge = (challenge: any) => {
    setSelectedChallenge(challenge)
    setShowAcceptModal(true)
  }

  const handleReportScore = (challenge: any) => {
    setSelectedChallenge(challenge)
    setShowReportScoreModal(true)
  }

  const handleScoreConfirm = (challenge: any) => {
    setSelectedChallenge(challenge)
    console.log(challenge)
    setShowConfirmScoreModal(true)
  }

  const confirmCancelChallenge = async () => {
    if (selectedChallenge) {
      const { data, error: fetchError } = await supabase
        .from("esports")
        .select("status")
        .eq("id", selectedChallenge.id)
        .single()

      if (fetchError) {
        setErrorMessage("error canceling game")
        setShowErrorModal(true)
        return
      }

      if (data.status == 1) {
        const { error: updateError } = await supabase
          .from("esports")
          .update({ status: 0 })
          .eq("id", selectedChallenge.id)

        if (updateError) {
          setErrorMessage("error canceling game")
          setShowErrorModal(true)
        } else {
          setSuccessMessage("game canceled")
          setShowSuccessModal(true)
          fetchPendingChallenges()
        }
      } else {
        setErrorMessage("game already accepted, request your opponent cancel")
        setShowErrorModal(true)
      }
    }

    setShowCancelModal(false)
    setSelectedChallenge(null)
  }
  
  const confirmAcceptChallenge = async () => {
    console.log("here")
    if (selectedChallenge) {
      //check user balance
      let balance = 0
      let gameAmount = selectedChallenge.amount / 10 ** 9
      
      if(selectedChallenge.money==1){
      balance = userData.balance_sol
      let fee = gameAmount * 0.03
      gameAmount = gameAmount + fee
      }else{
      balance = userData.balance_gamer
      }
      balance = balance / 10 ** 9
      if (balance >= gameAmount) {
        const { error } = await supabase.from("esports").update({ status: 2 }).eq("id", selectedChallenge.id)

        if (error) {
          console.error("Error accepting challenge:", error)
        } else {
          fetchPendingChallenges()
        }
      }
    }
    setShowAcceptModal(false)
    setSelectedChallenge(null)
  }

  const confirmRejectChallenge = async () => {
    if (selectedChallenge) {
      console.log("rejecting")
      const { error } = await supabase.from("esports").update({ status: 0 }).eq("id", selectedChallenge.id)

      if (error) {
        console.error("Error accepting challenge:", error)
        setErrorMessage("error rejecting challenge")
        setShowErrorModal(true)
      } else {
        setSuccessMessage("challenge rejected")
        setShowSuccessModal(true)

        fetchPendingChallenges()
      }
    }
    setShowAcceptModal(false)
    setSelectedChallenge(null)
  }

  const submitScore = async (player1Score: number, player2Score: number) => {
    if (selectedChallenge) {
      const { error } = await supabase
        .from("esports")
        .update({
          status: 3,
          player1score: player1Score,
          player2score: player2Score,
          scoredby: publicKey,
        })
        .eq("id", selectedChallenge.id)

      if (error) {
        console.error("Error submitting score:", error)
        setErrorMessage("error reporting score")
        setShowErrorModal(true)
      } else {
        fetchPendingChallenges()
        fetchEsportsRecords()
        setSuccessMessage("score reported, your oppoent must confirm")
        setShowSuccessModal(true)
      }

      setShowReportScoreModal(false)
      //   setSelectedChallenge(null)
    }
    // console.log(selectedChallenge)
  }

  const fetchAvailableGames = async () => {
    setAvailableGames(popularGames)
  }

  const handleConfirmScore = async () => {
    if (selectedChallenge) {
      //get game
      const { data, error: fetchError } = await supabase
        .from("esports")
        .select("*")
        .eq("id", selectedChallenge.id)
        .single()

      const player1score = data.player1score
      const player2score = data.player2score
      const player1 = data.player1
      const player2 = data.player2
      const amount = data.amount
      const fee = data.fee

      const response = await fetch("/api/esports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1: player1,
          player2: player2,
          player1score: player1score,
          player2score: player2score,
          amount: amount,
          fee: fee,
        }),
      })

      const { error } = await supabase
        .from("esports")
        .update({
          status: 9,
          score_confirmed_at: new Date().toISOString(),
        })
        .eq("id", selectedChallenge.id)

      if (error) {
        console.error("Error confirming score:", error)
        setErrorMessage("error confirm score error")
        setShowErrorModal(true)
      } else {
        fetchPendingChallenges()
        fetchEsportsRecords()
        setSuccessMessage("score confirmed")
        setShowSuccessModal(true)
      }
      setShowConfirmScoreModal(false)
      setSelectedChallenge(null)
    }
  }

  const handleDisputeScore = async () => {
    if (selectedChallenge) {
      const { error } = await supabase
        .from("esports")
        .update({
          status: 5,
          disputed_at: new Date().toISOString(),
        })
        .eq("id", selectedChallenge.id)

      if (error) {
        console.error("Error disputing score:", error)
        setErrorMessage("error disputing score")
        setShowErrorModal(true)
      } else {
        fetchPendingChallenges()
        setSuccessMessage("dispute score in progress")
        setShowSuccessModal(true)
      }
    }
    setShowConfirmScoreModal(false)
    setSelectedChallenge(null)
  }

  const handleMutualCancel = async (publicKey: string) => {
    if (selectedChallenge) {
      const { data, error: fetchError } = await supabase
        .from("esports")
        .select("status")
        .eq("id", selectedChallenge.id)
        .single()

      if (fetchError) {
        setErrorMessage("error finding game")
        setShowErrorModal(true)
        return
      }

      if (data.status == 6) {
        ///mutual cancel already requested
        const { error } = await supabase
          .from("esports")
          .update({
            status: 7,
          })
          .eq("id", selectedChallenge.id)

        if (error) {
          console.error("Error mutually cancelling challenge:", error)
          setErrorMessage("error with mutual cancel")
          setShowErrorModal(true)
        } else {
          fetchPendingChallenges()
          setSuccessMessage("mutual cancel completed")
          setShowSuccessModal(true)
        }
      } else if (data.status == 2 || data.status == 3 || data.status == 5) {
        ///1st player to request mutual cancel

        const { error } = await supabase
          .from("esports")
          .update({
            status: 6,
            cancelled_at: new Date().toISOString(),
            cancelled_by: publicKey,
          })
          .eq("id", selectedChallenge.id)

        if (error) {
          console.error("Error mutually cancelling challenge:", error)
          setErrorMessage("error with mutual cancel")
          setShowErrorModal(true)
        } else {
          fetchPendingChallenges()
          setSuccessMessage("mutual cancel requested")
          setShowSuccessModal(true)
        }
      }
    }
    setShowMutualCancelModal(false)
    setSelectedChallenge(null)
  }

  const fetchUserProfile = async (userId: string) => {
    // In a real application, you would fetch this data from your database
    // This is a mock implementation
    const mockProfile: UserEsportsProfile = {
      username: `User${userId.slice(0, 4)}`,
      avatarUrl: `/placeholder.svg`,
      winLossRecord: {
        Game1: { wins: 10, losses: 5 },
        Game2: { wins: 7, losses: 3 },
      },
      amountWon: 1000,
      amountLost: 500,
      winStreak: 3,
      lossStreak: 0,
    }
    setUserProfiles((prev) => ({ ...prev, [userId]: mockProfile }))
  }

  const handleUserClickOld = (userId: string) => {
    setSelectedUser(userId)
    if (!userProfiles[userId]) {
      fetchUserProfile(userId)
    }
    if (!oneOnOneMessages[userId]) {
      // Fetch one-on-one messages or initialize an empty array
      setOneOnOneMessages((prev) => ({ ...prev, [userId]: [] }))
    }
  }

  const handleSendOneOnOneMessage = async () => {
    if (newOneOnOneMessage.trim() === "" || !selectedUser) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      chatroom_id: selectedUser,
      sender_id: publicKey!.toString(),
      sender_name: user_name,
      sender_public_key: publicKey!.toString(),
      sender_avatar: user_avater,
      content: newOneOnOneMessage,
      created_at: new Date().toISOString(),
    }

    setOneOnOneMessages((prev) => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), newMessage],
    }))
    setNewOneOnOneMessage("")

    // In a real application, you would save this message to your database
  }

  // Add this effect for real-time updates
  useEffect(() => {
    if (!publicKey) return

    const chatSubscription = supabase
      .channel("chat_1on1")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_1on1", filter: `receiver_id=eq.${publicKey.toString()}` },
        (payload) => {
          const senderId = payload.new.sender_id
          // Fetch sender info and open chat window
          fetchUserInfo(senderId).then((userInfo) => {
            if (userInfo) {
              setActiveChats((prev) => ({
                ...prev,
                [senderId]: { name: userInfo.username, avatar: userInfo.avatar_url },
              }))
            }
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chatSubscription)
    }
  }, [publicKey])

  // Add this function to fetch user info
  const fetchUserInfo = async (publicKey: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("username, avatar_url")
      .eq("publicKey", publicKey)
      .single()

    if (error) {
      console.error("Error fetching user info:", error)
      return null
    }

    return data
  }

  const [activeTab, setActiveTab] = useState("list")

  useEffect(() => {
    const handleSwitchToCreateTournament = () => {
      setActiveTab("create")
    }

    document.addEventListener("switchToCreateTournament", handleSwitchToCreateTournament)

    return () => {
      document.removeEventListener("switchToCreateTournament", handleSwitchToCreateTournament)
    }
  }, [])

    useEffect(() => {
      scrollToBottom();
    }, [messages]);
    
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary neon-glow">Esports Arena</h1>
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="chat" className="text-lg">
              Chat
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-lg" onClick={fetchPendingChallenges}>
              Pending
            </TabsTrigger>
            <TabsTrigger value="history" className="text-lg">
              History
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="text-lg">
              Tournaments
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      <Button onClick={handleNewChatRoom} className="shrink-0">
                        Create
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <ul className="space-y-2">
                        {chatRooms.map((room) => (
                          <li key={room.id}>
                            <Button
                              onClick={() => handleChatRoomSelect(room)}
                              variant={selectedChatRoom?.id === room.id ? "default" : "outline"}
                              className="w-full justify-start"
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
                  <ScrollArea className="h-[400px] mb-4" ref={scrollAreaRef}>
                    {selectedChatRoom ? (
                      <ul className="space-y-4">
                        {messages.map((message: any) => (
                          <li key={message.id} className="flex items-start space-x-2">
                            <div>
                              <p className="font-semibold">
                                <span className="text-primary">
                                  {/* Update the onClick handler for user names in the chat messages */}
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleUserClick(
                                        message.sender_public_key,
                                        message.sender_name,
                                        message.sender_avatar || "/placeholder.svg",
                                      )
                                    }}
                                  >
                                    {message.sender_name}
                                  </a>
                                </span>
                                : {message.content}
                              </p>{" "}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-muted-foreground">Select a chat room to view messages.</p>
                    )}
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center w-full space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault() // Prevents default form submission behavior
                          handleSendMessage()
                        }
                      }}
                      className="flex-grow"
                    />
                    <Button onClick={handleSendMessage}>Send</Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
            {selectedUser && (
              <Card className="mt-8 bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Esports Profile</h3>
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={userProfiles[selectedUser]?.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback>
                            {userProfiles[selectedUser]?.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-semibold">{userProfiles[selectedUser]?.username}</p>
                          <p className="text-sm text-muted-foreground">{selectedUser}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold">Amount Won</p>
                          <p className="text-green-500">{userProfiles[selectedUser]?.amountWon} SOL</p>
                        </div>
                        <div>
                          <p className="font-semibold">Amount Lost</p>
                          <p className="text-red-500">{userProfiles[selectedUser]?.amountLost} SOL</p>
                        </div>
                        <div>
                          <p className="font-semibold">Win Streak</p>
                          <p className="flex items-center">
                            <ChevronUp className="text-green-500 mr-1" />
                            {userProfiles[selectedUser]?.winStreak}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold">Loss Streak</p>
                          <p className="flex items-center">
                            <ChevronDown className="text-red-500 mr-1" />
                            {userProfiles[selectedUser]?.lossStreak}
                          </p>
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold mt-4 mb-2">Win/Loss Record</h4>
                      <ul className="space-y-2">
                        {Object.entries(userProfiles[selectedUser]?.winLossRecord || {}).map(([game, record]) => (
                          <li key={game} className="flex justify-between items-center">
                            <span>{game}</span>
                            <span>
                              <span className="text-green-500 mr-2">{record.wins}W</span>
                              <span className="text-red-500">{record.losses}L</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-4">One-on-One Chat</h3>
                      <ScrollArea className="h-[300px] mb-4">
                        <ul className="space-y-4">
                          {oneOnOneMessages[selectedUser]?.map((message) => (
                            <li
                              key={message.id}
                              className={`flex ${message.sender_id === publicKey!.toString() ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] p-2 rounded ${message.sender_id === publicKey!.toString() ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                              >
                                <p>{message.content}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Type your message..."
                          value={newOneOnOneMessage}
                          onChange={(e) => setNewOneOnOneMessage(e.target.value)}
                          className="flex-grow"
                        />
                        <Button onClick={handleSendOneOnOneMessage}>Send</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="mt-8">
              <Button onClick={() => setShowChallengeModal(true)} className="w-full">
                Send Challenge
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="pending">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader style={{ marginBottom: "41px" }}>
                <CardTitle className="text-2xl text-primary">Pending Challenges</CardTitle>
              </CardHeader>
              <CardContent className="-mt-8">
                {pendingChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingChallenges.map((challenge: any) => (
                      <Card
                        key={challenge.id}
                        className="bg-black/50 border-primary/30 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 z-0"></div>
                          <CardContent className="relative z-10 p-6">
                            <div className="flex items-center space-x-4 mb-4">
                              <Avatar className="w-16 h-16 border-2 border-primary">
                                <AvatarImage src={challenge.player2_avatar} />
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {challenge.player2_name}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-lg font-bold text-primary">{challenge.player2_name}</h3>
                                <div className="flex items-center space-x-2 text-sm text-primary/80">
                                  <Trophy className="w-4 h-4" />
                                  <span>Rank: #123</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <Gamepad className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium text-primary">{challenge.game}</span>
                                </div>
                                <Badge variant="outline" className="text-primary border-primary">
                                  {challenge.console}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium text-primary">{challenge.amount} GAMER</span>
                                </div>
                                <Badge className="bg-primary/20 text-primary">W: 0 - L: 0</Badge>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-primary/70 mb-4">
                              <div className="flex items-center space-x-1">
                                <Zap className="w-3 h-3" />
                                <span>Win Streak: </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Swords className="w-3 h-3" />
                                <span>Loss Streak: </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {challenge.player2 == publicKey && challenge.status == 1 && (
                                <Button
                                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                  onClick={() => handleAcceptChallenge(challenge)}
                                >
                                  Accept
                                </Button>
                              )}

                              {challenge.scoredby != publicKey && challenge.status == 3 && (
                                <Button
                                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                  onClick={() => handleScoreConfirm(challenge)}
                                >
                                  Confirm Score
                                </Button>
                              )}
                              {challenge.player2 == publicKey && challenge.status == 4 && (
                                <p className="text-center">game over</p>
                              )}

                              {challenge.player1 == publicKey && challenge.status == 1 && (
                                <Button
                                  variant="destructive"
                                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                                  onClick={() => handleCancelChallenge(challenge)}
                                >
                                  Cancel
                                </Button>
                              )}
                              {challenge.status == 2 && (
                                <>
                                  <Button
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                    onClick={() => handleReportScore(challenge)}
                                  >
                                    Report Score
                                  </Button>
                                  <Button
                                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                    onClick={() => {
                                      setSelectedChallenge(challenge)
                                      setShowMutualCancelModal(true)
                                    }}
                                  >
                                    Mutual Cancel
                                  </Button>
                                </>
                              )}
                              {challenge.status == 6 && (
                                <>
                                  <Button
                                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                    onClick={() => {
                                      setSelectedChallenge(challenge)
                                      setShowMutualCancelModal(true)
                                    }}
                                  >
                                    Mutual Cancel
                                  </Button>
                                </>
                              )}
                              {challenge.scoredby == publicKey && challenge.status == 3 && (
                                <Button
                                  variant="destructive"
                                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                                  onClick={() => handleCancelChallenge(challenge)}
                                >
                                  Pending Score Confirm
                                </Button>
                              )}
                              {challenge.player1 == publicKey && challenge.status == 4 && (
                                <p className="text-center">game over</p>
                              )}
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
                    <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                      Find Opponents
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            {selectedChallenge && (
              <>
                <CancelChallengeModal
                  isOpen={showCancelModal}
                  onClose={() => setShowCancelModal(false)}
                  onConfirm={confirmCancelChallenge}
                  challengeDetails={selectedChallenge}
                />

                <AcceptChallengeModal
                  isOpen={showAcceptModal}
                  onClose={() => setShowAcceptModal(false)}
                  onConfirm={confirmAcceptChallenge}
                  onReject={confirmRejectChallenge}
                  challengeDetails={selectedChallenge}
                />
                <ReportScoreModal
                  isOpen={showReportScoreModal}
                  onClose={() => setShowReportScoreModal(false)}
                  onSubmit={submitScore}
                  player1Name={selectedChallenge?.player1_name || "Player 1"}
                  player2Name={selectedChallenge?.player2_name || "Player 2"}
                />
                <ConfirmScoreModal
                  isOpen={showConfirmScoreModal}
                  onClose={() => setShowConfirmScoreModal(false)}
                  onConfirm={handleConfirmScore}
                  onDispute={() => {
                    setShowConfirmScoreModal(false)
                    setShowDisputeScoreModal(true)
                  }}
                  player1Name={selectedChallenge?.player1_name}
                  player2Name={selectedChallenge?.player2_name}
                  initialPlayer1Score={selectedChallenge?.player1score}
                  initialPlayer2Score={selectedChallenge?.player2score}
                />

                <DisputeScoreModal
                  isOpen={showDisputeScoreModal}
                  onClose={() => setShowDisputeScoreModal(false)}
                  onSubmit={handleDisputeScore}
                  player1Name={selectedChallenge?.player1?.username || "Player 1"}
                  player2Name={selectedChallenge?.player2?.username || "Player 2"}
                  initialPlayer1Score={selectedChallenge?.player1score || 0}
                  initialPlayer2Score={selectedChallenge?.player2score || 0}
                />

                <MutualCancelModal
                  isOpen={showMutualCancelModal}
                  onClose={() => setShowMutualCancelModal(false)}
                  onConfirm={handleMutualCancel}
                  publicKey={publicKey || ""}
                />
              </>
            )}
          </TabsContent>
          <TabsContent value="history">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Game History</CardTitle>
              </CardHeader>
              <CardContent>
                {gameHistory.length > 0 ? (
                  <ul className="space-y-4">
                    {gameHistory.map((game: any) => (
                      <li key={game.id} className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{game.game}</p>
                            <p className="text-sm text-muted-foreground">Console: {game.console}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{game.amount} SOL</p>
                            <p className="text-sm text-muted-foreground">
                              Opponent: {game.player1 === publicKey!.toString() ? game.player2 : game.player1}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <p>
                            <span className="font-semibold">Score:</span> {game.player1score} - {game.player2score}
                          </p>
                          <Badge variant={game.player1score > game.player2score ? "success" : "destructive"}>
                            {game.player1score > game.player2score ? "Won" : "Lost"}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-muted-foreground">No game history available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tournaments">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="list">Tournament List</TabsTrigger>
                    <TabsTrigger value="create">Create Tournament</TabsTrigger>
                  </TabsList>
                  <TabsContent value="list">
                    <TournamentList />
                  </TabsContent>
                  <TabsContent value="create">
                    <TournamentForm />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <HowItWorksSection />

        <Dialog open={showChallengeModal} onOpenChange={() => setShowChallengeModal(false)}>
          <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">Send Challenge</DialogTitle>
              <DialogDescription>Challenge another player to a match</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4 relative">
                <Label htmlFor="opponent" className="text-right">
                  Opponent
                </Label>
                <div className="col-span-3">
                  <Input
                    id="opponent"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Opponent's name"
                    className="w-full"
                    onFocus={() => query && setShowDropdown(true)}
                  />
                  {showDropdown && suggestions.length > 0 && (
                    <ul className="absolute z-10 mt-1 bg-black border border-blue-300 rounded-md max-h-40 overflow-auto text-white">
                      {suggestions.map((user: any) => (
                        <li
                          key={user.username}
                          onClick={() => handleSelect(user.username)}
                          className="px-4 py-2 cursor-pointer hover:bg-black-100"
                        >
                          {user.username}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="game" className="text-right">
                  Game
                </Label>
                <Select
                  onValueChange={(value) => setChallengeData({ ...challengeData, game: value })}
                  value={challengeData.game || ""}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGames.map((game) => (
                      <SelectItem key={game} value={game}>
                        {game}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="console" className="text-right">
                  Console
                </Label>
                <Select
                  onValueChange={(value) => setChallengeData({ ...challengeData, console: value })}
                  value={challengeData.console || ""}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a console" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="PS5">PS5</SelectItem>
                    <SelectItem value="Xbox Series X">Xbox Series X</SelectItem>
                    {/* Add more consoles as needed */}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4 w-full">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={challengeData.amount ?? ""}
                  onChange={(e) =>
                    setChallengeData({
                      ...challengeData,
                      amount: e.target.value === "" ? "" : Number.parseFloat(e.target.value),
                    })
                  }
                  placeholder="Game Amount"
                  style={{ width: "272px" }}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="console" className="text-right">
                  Money
                </Label>
                <Select
                  onValueChange={(value) => setChallengeData({ ...challengeData, console: value })}
                  value={challengeData.console || ""}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a console" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Solana</SelectItem>
                    <SelectItem value="2">Gamer</SelectItem>
                    {/* Add more consoles as needed */}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rules" className="text-right">
                  Rules
                </Label>
                <Textarea
                  id="rules"
                  value={challengeData.rules || ""}
                  onChange={(e) => setChallengeData({ ...challengeData, rules: e.target.value })}
                  placeholder="Specific rules for the match"
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowChallengeModal(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSendChallenge} type="submit">
                Send Challenge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
        <div className="fixed bottom-4 right-4 flex flex-row-reverse space-x-4 space-x-reverse">
          {Object.entries(activeChats).map(([userId, { name, avatar }]) => (
            <ChatPopup
              key={userId}
              senderId={publicKey?.toString() || ""}
              receiverId={userId}
              receiverName={name}
              receiverAvatar={avatar}
              onClose={() => handleCloseChat(userId)}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

export default EsportsPage

