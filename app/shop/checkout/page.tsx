"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Header } from "@/components/header"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { CreditCard, Loader2, PlusCircle, Sparkles } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { AddressModal } from "@/components/address-modal"

interface Address {
  id: string
  full_name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  phone_number: string | null
}

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const router = useRouter()
  const { publicKey } = useWallet()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (publicKey) {
      fetchAddresses()
    }
  }, [publicKey])

  const fetchAddresses = async () => {
    setIsLoading(true)
    if (!publicKey) {
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.from("user_address").select("*").eq("wallet_address", publicKey.toString())

    if (error) {
      console.error("Error fetching addresses:", error)
      toast({
        title: "Error",
        description: "Failed to load addresses. Please try again.",
        variant: "destructive",
      })
    } else {
      setAddresses(data || [])
      const defaultAddress = data?.find((addr) => addr.is_default)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      }
    }
    setIsLoading(false)
  }

  const handleAddNewAddress = () => {
    setIsAddressModalOpen(true)
  }

  const handleAddressSubmit = async (newAddress: Omit<Address, "id">) => {
    if (!publicKey) return

    const { data, error } = await supabase.from("user_address").insert({
      ...newAddress,
      wallet_address: publicKey.toString(),
    })

    if (error) {
      console.error("Error adding new address:", error)
      toast({
        title: "Error",
        description: "Failed to add new address. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "New address added successfully.",
      })
      fetchAddresses()
    }
    setIsAddressModalOpen(false)
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast({
        title: "Error",
        description: "Please select a shipping address.",
        variant: "destructive",
      })
      return
    }

    // Here you would implement the logic to place the order
    // This might involve creating an order in your database,
    // processing payment, etc.

    toast({
      title: "Order Placed",
      description: "Your order has been successfully placed!",
    })

    // Clear the cart after successful order
    if (publicKey) {
      await supabase.from("cart").delete().eq("public_key", publicKey.toString())
    }

    router.push("/order-confirmation")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
        <Header />
        <div className="container mx-auto p-4 space-y-8 flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-8 shadow-2xl mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 text-center">Checkout</h1>
          <p className="text-xl text-secondary-foreground text-center mb-4">Complete your purchase</p>
          <p className="text-lg text-center text-primary/80">
            <Sparkles className="inline-block mr-2 h-5 w-5 text-yellow-400" />
            GAME token holders enjoy exclusive discounts on their purchase!
          </p>
        </div>
        <Card className="bg-gradient-to-br from-gray-900/90 to-slate-900/90 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2 text-primary">Shipping Address</h2>
              {addresses.length === 0 ? (
                <p className="text-gray-400">You have no saved addresses.</p>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="flex items-center space-x-2 mb-2">
                    <Input
                      type="radio"
                      id={`address-${address.id}`}
                      name="address"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="text-primary border-primary"
                    />
                    <Label htmlFor={`address-${address.id}`} className="text-primary">
                      {address.full_name}, {address.address_line1}, {address.city}, {address.state}{" "}
                      {address.postal_code}, {address.country}
                    </Label>
                  </div>
                ))
              )}
              <Button onClick={handleAddNewAddress} variant="outline" className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Address
              </Button>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2 text-primary">Payment Information</h2>
              <p className="text-gray-400">Payment processing will be implemented in the future.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handlePlaceOrder}
              disabled={!selectedAddressId}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Place Order
            </Button>
          </CardFooter>
        </Card>
      </div>
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSubmit={handleAddressSubmit}
      />
    </div>
  )
}

