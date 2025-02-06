"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@solana/wallet-adapter-react"

// This is mock data. In a real application, this would come from a database.
const mockThreads = [
  {
    id: 1,
    title: "Best strategy for Crypto Clash?",
    author: "CryptoGamer123",
    replies: 15,
    lastActivity: "2 hours ago",
  },
  {
    id: 2,
    title: "Bug report: Neon Riders crash on level 5",
    author: "BugHunter",
    replies: 3,
    lastActivity: "1 day ago",
  },
  {
    id: 3,
    title: "Suggestion: Add team battles to Blockchain Brawlers",
    author: "TeamPlayer",
    replies: 7,
    lastActivity: "3 days ago",
  },
]

export default function CommunityPage() {
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [newThreadContent, setNewThreadContent] = useState("")
  const { publicKey } = useWallet()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send this data to your backend
    console.log("New thread:", { title: newThreadTitle, content: newThreadContent })
    // Reset form
    setNewThreadTitle("")
    setNewThreadContent("")
  }

  return (
    <div className="min-h-screen bg-background text-foreground neon-grid">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary neon-glow">Community Forums</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Latest Discussions</CardTitle>
              </CardHeader>
              <CardContent>
                {mockThreads.map((thread) => (
                  <div key={thread.id} className="mb-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-bold">{thread.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Started by {thread.author} - {thread.lastActivity} - {thread.replies} replies
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Start a New Discussion</CardTitle>
              </CardHeader>
              <CardContent>
                {publicKey ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      placeholder="Thread Title"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newThreadContent}
                      onChange={(e) => setNewThreadContent(e.target.value)}
                      rows={4}
                    />
                    <Button type="submit" className="w-full">
                      Post Discussion
                    </Button>
                  </form>
                ) : (
                  <p>Please connect your wallet to start a new discussion.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

