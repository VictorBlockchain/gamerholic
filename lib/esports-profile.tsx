"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [games, setGames] = useState<any[]>([])
  const [esportsGames, setEsportsGames] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [esportsRecord, setEsportsRecord] = useState({ wins: 0, losses: 0, earnings: 0 })
  const [chatMessages, setChatMessages] = useState([])
  const params = useParams()
  const profileId = params.id as string
//   const user = useUser()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url, esports_wins, esports_losses, esports_earnings")
        .eq("id", profileId)
        .single()

      if (error) {
        console.error("Error fetching profile:", error)
      } else {
        setProfile(data)
        setIsOwnProfile(user?.id === data.id)
      }
    }

    const fetchGames = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching games:", error)
      } else {
        setGames(data)
      }
    }

    const fetchEsportsGames = async () => {
      const { data, error } = await supabase
        .from("esports")
        .select("*")
        .or(`player1.eq.${profileId},player2.eq.${profileId}`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching esports games:", error)
      } else {
        setEsportsGames(data)
      }
    }

    const fetchEsportsRecord = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from("users")
        .select("esports_wins, esports_losses, esports_earnings")
        .eq("id", profileId)
        .single()

      if (error) {
        console.error("Error fetching esports record:", error)
      } else {
        setEsportsRecord({
          wins: data.esports_wins || 0,
          losses: data.esports_losses || 0,
          earnings: data.esports_earnings || 0,
        })
      }
    }

    fetchProfile()
    fetchGames()
    fetchEsportsGames()
    fetchEsportsRecord()
  }, [profileId, supabase, user])

  useEffect(() => {
    const fetchMessages = async () => {
      if (!isOwnProfile && user) {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user.id})`,
          )
          .is("chatroom_id", null)
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Error fetching messages:", error)
        } else {
          setMessages(data)
        }
      }
    }

    fetchMessages()
  }, [isOwnProfile, profileId, supabase, user])

  const sendMessage = async () => {
    if (newMessage.trim() === "" || !user) return

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: profileId,
      content: newMessage,
    })

    if (error) {
      console.error("Error sending message:", error)
    } else {
      setNewMessage("")
      // Fetch messages again to update the chat
      const { data, error: fetchError } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user.id})`,
        )
        .is("chatroom_id", null)
        .order("created_at", { ascending: true })

      if (fetchError) {
        console.error("Error fetching messages:", fetchError)
      } else {
        setMessages(data)
      }
    }
  }

  if (!profile) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile.username}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="games">
            <TabsList>
              <TabsTrigger value="games">Arcade Games</TabsTrigger>
              <TabsTrigger value="esports">Esports</TabsTrigger>
              {!isOwnProfile && <TabsTrigger value="chat">Chat</TabsTrigger>}
            </TabsList>
            <TabsContent value="games">
              <h3 className="text-lg font-semibold mb-2">Recent Arcade Games</h3>
              {games.map((game) => (
                <div key={game.id} className="mb-2">
                  <p>
                    {game.game_name} - Score: {game.score}
                  </p>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="esports">
              <Card>
                <CardHeader>
                  <CardTitle>Esports Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Wins</p>
                      <p className="text-2xl font-bold">{esportsRecord.wins}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Losses</p>
                      <p className="text-2xl font-bold">{esportsRecord.losses}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Earnings</p>
                      <p className="text-2xl font-bold">{esportsRecord.earnings.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <h3 className="text-lg font-semibold mt-4 mb-2">Recent Esports Games</h3>
              {esportsGames.map((game) => (
                <div key={game.id} className="mb-2">
                  <p>
                    {game.game} - {game.console}
                  </p>
                  <p>
                    Result: {game.player1 === profileId ? game.player1score : game.player2score} -{" "}
                    {game.player1 === profileId ? game.player2score : game.player1score}
                  </p>
                </div>
              ))}
            </TabsContent>
            {!isOwnProfile && (
              <TabsContent value="chat">
                <Card>
                  <CardHeader>
                    <CardTitle>One-on-One Chat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 overflow-y-auto mb-4 border p-2">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`mb-2 ${message.sender_id === user?.id ? "text-right" : "text-left"}`}
                        >
                          <span
                            className={`inline-block p-2 rounded ${message.sender_id === user?.id ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                          >
                            {message.content}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow mr-2"
                      />
                      <Button onClick={sendMessage}>Send</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

