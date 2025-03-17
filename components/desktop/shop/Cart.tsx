"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingCart, Trash2, ArrowLeft, CreditCard, Sparkles, Loader2, ShoppingBag } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"

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

export function CartDesktop() {
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
              <p className="text-gray-400 mb-6">Please connect your wallet to view your cart and make purchases.</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" className="text-primary flex items-center" onClick={handleContinueShopping}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
          <h1 className="text-3xl font-bold text-primary">Your Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 max-w-3xl mx-auto">
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-primary/30 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-primary mb-2">Your Cart is Empty</h2>
              <p className="text-gray-400 mb-6">Looks like you haven't added any items to your cart yet.</p>
              <Button
                onClick={handleContinueShopping}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-primary">
                    Shopping Cart ({cartItems.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-primary/10">
                          <TableHead className="text-primary">Product</TableHead>
                          <TableHead className="text-primary">Size</TableHead>
                          <TableHead className="text-primary">Color</TableHead>
                          <TableHead className="text-primary">Quantity</TableHead>
                          <TableHead className="text-primary text-right">Price</TableHead>
                          <TableHead className="text-primary text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.id} className="border-b border-primary/10">
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="h-16 w-16 rounded-md overflow-hidden bg-black/50 flex-shrink-0">
                                  <img
                                    src={item.shop_items.images[0] || "/placeholder.svg?height=64&width=64"}
                                    alt={item.shop_items.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-primary">{item.shop_items.name}</p>
                                  {item.shop_items.discount > 0 && (
                                    <p className="text-xs text-[#FF007A]">{item.shop_items.discount}% OFF</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-primary">{item.size}</TableCell>
                            <TableCell className="text-primary">{item.color}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 border-primary/30 text-primary"
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
                                  className="w-12 h-8 mx-1 text-center bg-[#111] border-primary/30 text-primary"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 border-primary/30 text-primary"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.shop_items.discount > 0 ? (
                                <div>
                                  <span className="text-primary">
                                    {(item.shop_items.price * (1 - item.shop_items.discount / 100)).toFixed(2)} GAME
                                  </span>
                                  <div className="text-xs line-through text-gray-400">
                                    {item.shop_items.price.toFixed(2)} GAME
                                  </div>
                                </div>
                              ) : (
                                <span className="text-primary">{item.shop_items.price.toFixed(2)} GAME</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-primary">
                              {calculateItemTotal(item).toFixed(2)} GAME
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-primary"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-primary font-medium">{subtotal.toFixed(2)} GAME</span>
                  </div>

                  {tokenDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Sparkles className="h-4 w-4 text-[#00FFA9] mr-1" />
                        <span className="text-[#00FFA9]">
                          GAME Token Discount ({(tokenDiscount * 100).toFixed(0)}%)
                        </span>
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
                      Hold GAME tokens to receive exclusive discounts on your purchases:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
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
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleCheckout}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Proceed to Checkout
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

