"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function SupportPage() {
  const { publicKey } = useWallet()
  const [category, setCategory] = useState("")
  const [gameId, setGameId] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey) {
      alert("Please connect your wallet to submit a support request")
      return
    }

    try {
      const { data, error } = await supabase.from("support_tickets").insert({
        user_id: publicKey.toBase58(),
        category,
        game_id: category === "game" ? gameId : null,
        transaction_id: category === "deposit" ? transactionId : null,
        message,
        status: "open",
      })

      if (error) throw error

      alert("Support ticket submitted successfully!")
      setCategory("")
      setGameId("")
      setTransactionId("")
      setMessage("")
    } catch (error) {
      console.error("Error submitting support ticket:", error)
      alert("Error submitting support ticket. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-primary">Support</h1>
        <Card>
          <CardHeader>
            <CardTitle>Submit a Support Ticket</CardTitle>
            <CardDescription>
              Please provide details about your issue. We'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="game">Game Issue</SelectItem>
                    <SelectItem value="deposit">Deposit Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {category === "game" && (
                <div>
                  <label htmlFor="gameId" className="block text-sm font-medium text-foreground mb-1">
                    Game ID
                  </label>
                  <Input
                    id="gameId"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    placeholder="Enter the Game ID"
                    required
                  />
                </div>
              )}
              {category === "deposit" && (
                <div>
                  <label htmlFor="transactionId" className="block text-sm font-medium text-foreground mb-1">
                    Transaction ID
                  </label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter the Transaction ID"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail"
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Support Ticket
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

