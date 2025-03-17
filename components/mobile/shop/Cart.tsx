"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingCart, Trash2, ArrowLeft, CreditCard, Sparkles, Loader2, ShoppingBag } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

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

export function CartMobile() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, player, profile } = useUser()

  useEffect(() => {
    if (isAuthenticated && player?.wallet_address) {
      fetchCartItems()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, player])

  const fetchCartItems = async () => {
    if (!player?.wallet_address) return

    setIsLoading(true)

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

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1 || !player?.wallet_address) return

    const { error } = await supabase
      .from("cart")
      .update({ quantity: newQuantity })
      .eq("id", itemId)
      .eq("public_key", player.wallet_address)

    if (error) {
      console.error("Error updating cart item:", error)
      toast({
        title: "Error",
        description: "Failed to update cart. Please try again.",
        variant: "destructive",
      })
    } else {
      fetchCartItems()
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!player?.wallet_address) return

    const { error } = await supabase.from("cart").delete().eq("id", itemId).eq("public_key", player.wallet_address)

    if (error) {
      console.error("Error removing cart item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item from cart. Please try again.",
        variant: "destructive",
      })
    } else {
      fetchCartItems()
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart.",
      })
    }
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

  const handleCheckout = () => {
    router.push("/shop/checkout")
  }

  const handleContinueShopping = () => {
    router.push("/shop")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground pt-20">
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-primary">Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-6">
              <ShoppingBag className="h-12 w-12 text-primary/30 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">
                Please connect your wallet to view your cart and make purchases.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground pt-20">
      <main className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" className="text-primary p-0 h-8" onClick={handleContinueShopping}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-primary">Your Cart</h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>

        {cartItems.length === 0 ? (
          <ScrollReveal>
            <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
              <CardContent className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-primary mb-2">Your Cart is Empty</h2>
                <p className="text-xs text-gray-400 mb-4">Looks like you haven't added any items to your cart yet.</p>
                <Button
                  onClick={handleContinueShopping}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                >
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollReveal>
              <div className="mb-4">
                <h2 className="text-sm font-medium text-gray-400 mb-2">Cart Items ({cartItems.length})</h2>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <Card
                      key={item.id}
                      className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden"
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="h-20 w-20 rounded-md overflow-hidden bg-black/50 flex-shrink-0">
                            <img
                              src={item.shop_items.images[0] || "/placeholder.svg?height=80&width=80"}
                              alt={item.shop_items.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-primary text-sm">{item.shop_items.name}</h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-primary h-6 w-6 p-0"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <span className="mr-2">Size: {item.size}</span>
                              <span>Color: {item.color}</span>
                            </div>

                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 border-primary/30 text-primary p-0"
                                  onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                                  className="w-8 h-6 mx-1 text-center bg-[#111] border-primary/30 text-primary text-xs p-0"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 border-primary/30 text-primary p-0"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>

                              <div className="text-right">
                                {item.shop_items.discount > 0 ? (
                                  <div>
                                    <span className="text-primary text-sm font-medium">
                                      {(
                                        item.shop_items.price *
                                        (1 - item.shop_items.discount / 100) *
                                        item.quantity
                                      ).toFixed(2)}{" "}
                                      GAME
                                    </span>
                                    <div className="text-[10px] line-through text-gray-400">
                                      {(item.shop_items.price * item.quantity).toFixed(2)} GAME
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-primary text-sm font-medium">
                                    {(item.shop_items.price * item.quantity).toFixed(2)} GAME
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            {/* Order Summary */}
            <ScrollReveal>
              <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 mb-4">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-bold text-primary">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-primary font-medium">{subtotal.toFixed(2)} GAME</span>
                  </div>

                  {tokenDiscount > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center">
                        <Sparkles className="h-3 w-3 text-[#00FFA9] mr-1" />
                        <span className="text-[#00FFA9]">
                          GAME Token Discount ({(tokenDiscount * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <span className="text-[#00FFA9]">-{discountAmount.toFixed(2)} GAME</span>
                    </div>
                  )}

                  <Separator className="bg-primary/10 my-1" />

                  <div className="flex justify-between">
                    <span className="text-gray-200 font-medium text-sm">Total</span>
                    <span className="text-primary text-sm font-bold">{total.toFixed(2)} GAME</span>
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9"
                    onClick={handleCheckout}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Checkout
                  </Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
            {/* Token Benefits */}
            <ScrollReveal>
              <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 mb-4">
                <CardContent className="p-3">
                  <div className="flex items-center mb-2">
                    <Sparkles className="h-4 w-4 text-[#00FFA9] mr-2" />
                    <p className="text-xs font-medium text-primary">GAME Token Benefits</p>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">Hold GAME tokens to receive exclusive discounts:</p>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                    <div className="bg-black/40 rounded p-1">
                      <p className="text-gray-400">100+ GAME</p>
                      <p className="text-primary font-medium">5% Off</p>
                    </div>
                    <div className="bg-black/40 rounded p-1">
                      <p className="text-gray-400">500+ GAME</p>
                      <p className="text-primary font-medium">10% Off</p>
                    </div>
                    <div className="bg-black/40 rounded p-1">
                      <p className="text-gray-400">1000+ GAME</p>
                      <p className="text-primary font-medium">15% Off</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
            <div className="h-20"></div> {/* Bottom spacing for fixed nav */}
          </>
        )}
      </main>
    </div>
  )
}

