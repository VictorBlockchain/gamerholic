"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface SupportTicket {
  id: string
  category: string
  game_id: string | null
  transaction_id: string | null
  message: string
  status: "open" | "closed"
  admin_response: string | null
  created_at: string
  closed_at: string | null
}

export default function MySupportTicketsPage() {
  const { publicKey } = useWallet()
  const [tickets, setTickets] = useState<SupportTicket[]>([])

  useEffect(() => {
    if (publicKey) {
      fetchUserTickets()
    }
  }, [publicKey])

  const fetchUserTickets = async () => {
    if (!publicKey) return

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", publicKey.toBase58())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching support tickets:", error)
    } else {
      setTickets(data)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 text-primary">My Support Tickets</h1>
          <p>Please connect your wallet to view your support tickets.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-primary">My Support Tickets</h1>
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p>You haven't submitted any support tickets yet.</p>
              <Link href="/support">
                <Button className="mt-4">Create a Support Ticket</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {tickets.map((ticket) => (
              <AccordionItem key={ticket.id} value={ticket.id}>
                <AccordionTrigger>
                  <div className="flex items-center space-x-4">
                    <Badge variant={ticket.status === "open" ? "default" : "secondary"}>{ticket.status}</Badge>
                    <span>{ticket.category}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(ticket.created_at)}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardHeader>
                      <CardTitle>Ticket Details</CardTitle>
                      <CardDescription>Ticket ID: {ticket.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {ticket.game_id && (
                        <p>
                          <strong>Game ID:</strong> {ticket.game_id}
                        </p>
                      )}
                      {ticket.transaction_id && (
                        <p>
                          <strong>Transaction ID:</strong> {ticket.transaction_id}
                        </p>
                      )}
                      <div>
                        <strong>Your Message:</strong>
                        <p className="mt-1 whitespace-pre-wrap">{ticket.message}</p>
                      </div>
                      {ticket.admin_response && (
                        <div>
                          <strong>Admin Response:</strong>
                          <p className="mt-1 whitespace-pre-wrap">{ticket.admin_response}</p>
                        </div>
                      )}
                      {ticket.closed_at && (
                        <p>
                          <strong>Closed at:</strong> {formatDate(ticket.closed_at)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  )
}

