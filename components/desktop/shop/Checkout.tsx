"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Sparkles,
  Loader2,
  ShoppingBag,
  MapPin,
  PlusCircle,
  Wallet,
  CheckCircle2,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"

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
  is_default: boolean
}

interface CartItem {
  id: string
  item_id: string
  quantity: number
  size: string
  color: string
  shop_items: {
    id: string
    name: string
    price: number
    images: string[]
    discount: number
  }
}

export function CheckoutDesktop() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, player, profile } = useUser()

  useEffect(() => {
    if (isAuthenticated && player?.wallet_address) {
      fetchAddresses()
      fetchCartItems()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, player])

  const fetchAddresses = async () => {
    if (!player?.wallet_address) return

    const { data, error } = await supabase.from("user_address").select("*").eq("wallet_address", player.wallet_address)

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
      } else if (data && data.length > 0) {
        setSelectedAddressId(data[0].id)
      }
    }
  }

  const fetchCartItems = async () => {
    if (!player?.wallet_address) return

    const { data, error } = await supabase
      .from("cart")
      .select(`
        id,
        item_id,
        quantity,
        size,
        color,
        shop_items (
          id,
          name,
          price,
          images,
          discount
        )
      `)
      .eq("public_key", player.wallet_address)

    if (error) {
      console.error("Error fetching cart items:", error)
      toast({
        title: "Error",
        description: "Failed to load cart items. Please try again.",
        variant: "destructive",
      })
    } else {
      setCartItems(data || [])
    }

    setIsLoading(false)
  }

  const calculateItemTotal = (item: CartItem) => {
    const basePrice = item.shop_items.price
    const discountMultiplier = 1 - (item.shop_items.discount || 0) / 100
    return basePrice * discountMultiplier * item.quantity
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0)
  }

  // Simulate token discount based on token balance
  const getTokenDiscount = () => {
    // This would be replaced with actual token balance logic
    const tokenBalance = 500 // Example token balance

    if (tokenBalance >= 1000) return 0.15
    if (tokenBalance >= 500) return 0.1
    if (tokenBalance >= 100) return 0.05
    return 0
  }

  const tokenDiscount = getTokenDiscount()
  const subtotal = calculateSubtotal()
  const discountAmount = subtotal * tokenDiscount
  const total = subtotal - discountAmount

  const handleAddNewAddress = () => {
    setIsAddressModalOpen(true)
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

    if (!player?.wallet_address) return

    setIsProcessing(true)

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Clear the cart after successful order
    const { error } = await supabase.from("cart").delete().eq("public_key", player.wallet_address)

    if (error) {
      console.error("Error clearing cart:", error)
      toast({
        title: "Error",
        description: "There was an issue processing your order. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Order Placed",
        description: "Your order has been successfully placed!",
      })
      router.push("/shop")
    }

    setIsProcessing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
        <div className="container mx-auto px-4 py-12">
          <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <ShoppingBag className="h-16 w-16 text-primary/30 mx-auto mb-4" />
              <p className="text-gray-400 mb-6">Please connect your wallet to proceed with checkout.</p>
              <Button
                onClick={() => router.push("/")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
        <div className="container mx-auto px-4 py-12">
          <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">Your Cart is Empty</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <ShoppingCart className="h-16 w-16 text-primary/30 mx-auto mb-4" />
              <p className="text-gray-400 mb-6">You need to add items to your cart before checking out.</p>
              <Button
                onClick={() => router.push("/shop")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" className="text-primary flex items-center" onClick={() => router.push("/shop/cart")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold text-primary">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-xl font-bold text-primary">Shipping Address</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 mb-4">You don't have any saved addresses.</p>
                    <Button
                      onClick={handleAddNewAddress}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Address
                    </Button>
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedAddressId || ""}
                    onValueChange={setSelectedAddressId}
                    className="space-y-3"
                  >
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${
                          selectedAddressId === address.id
                            ? "border-primary bg-primary/5"
                            : "border-primary/20 bg-black/20"
                        }`}
                      >
                        <RadioGroupItem value={address.id} id={`address-${address.id}`} className="mt-1" />
                        <div className="flex-grow">
                          <Label
                            htmlFor={`address-${address.id}`}
                            className="flex items-center text-primary font-medium"
                          >
                            {address.full_name}
                            {address.is_default && (
                              <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </Label>
                          <p className="text-sm text-gray-400 mt-1">
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                          </p>
                          <p className="text-sm text-gray-400">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                          <p className="text-sm text-gray-400">{address.country}</p>
                          {address.phone_number && (
                            <p className="text-sm text-gray-400 mt-1">Phone: {address.phone_number}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {addresses.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleAddNewAddress}
                    className="mt-4 border-primary/30 text-primary"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Address
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-xl font-bold text-primary">Payment Method</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border border-primary/20 bg-black/20">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                    <p className="text-primary font-medium">Pay with GAME Tokens</p>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Your purchase will be processed using GAME tokens from your connected wallet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-black/50 flex-shrink-0">
                        <img
                          src={item.shop_items.images[0] || "/placeholder.svg?height=48&width=48"}
                          alt={item.shop_items.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-primary">{item.shop_items.name}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-400">
                            {item.size}, {item.color} × {item.quantity}
                          </p>
                          <p className="text-sm text-primary">{calculateItemTotal(item).toFixed(2)} GAME</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="bg-primary/10" />

                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-primary font-medium">{subtotal.toFixed(2)} GAME</span>
                </div>

                {tokenDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 text-[#00FFA9] mr-1" />
                      <span className="text-[#00FFA9]">GAME Token Discount ({(tokenDiscount * 100).toFixed(0)}%)</span>
                    </div>
                    <span className="text-[#00FFA9]">-{discountAmount.toFixed(2)} GAME</span>
                  </div>
                )}

                <div className="border-t border-primary/10 pt-4 flex justify-between">
                  <span className="text-gray-200 font-medium">Total</span>
                  <span className="text-primary text-xl font-bold">{total.toFixed(2)} GAME</span>
                </div>

                <div className="bg-black/30 p-3 rounded-lg border border-primary/10 mt-4">
                  <div className="flex items-center mb-2">
                    <Sparkles className="h-4 w-4 text-[#00FFA9] mr-2" />
                    <p className="text-sm font-medium text-primary">GAME Token Benefits</p>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    You're saving {discountAmount.toFixed(2)} GAME with your token discount!
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handlePlaceOrder}
                  disabled={!selectedAddressId || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

