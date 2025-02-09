"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Header } from "@/components/header"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Trash2, ShoppingCart, Loader2, Sparkles } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"

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
  }
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { publicKey } = useWallet()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (publicKey) {
      fetchCartItems()
    }
  }, [publicKey])

  const fetchCartItems = async () => {
    if (!publicKey) return

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
          images
        )
      `)
      .eq("public_key", publicKey.toString())

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
    if (newQuantity < 1 || !publicKey) return

    const { error } = await supabase
      .from("cart")
      .update({ quantity: newQuantity })
      .eq("id", itemId)
      .eq("public_key", publicKey.toString())

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
    if (!publicKey) return

    const { error } = await supabase.from("cart").delete().eq("id", itemId).eq("public_key", publicKey.toString())

    if (error) {
      console.error("Error removing cart item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item from cart. Please try again.",
        variant: "destructive",
      })
    } else {
      fetchCartItems()
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.quantity * item.shop_items.price, 0)
  }

  const handleCheckout = () => {
    router.push("/shop/checkout")
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
        <Header />
        <div className="container mx-auto p-4 space-y-8 flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-xl font-semibold">Please connect your wallet to view your cart.</p>
        </div>
      </div>
    )
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
          <h1 className="text-4xl font-bold text-primary mb-2 text-center">Your Shopping Cart</h1>
          <p className="text-xl text-secondary-foreground text-center mb-4">
            Review your items and proceed to checkout
          </p>
          <p className="text-lg text-center text-primary/80">
            <Sparkles className="inline-block mr-2 h-5 w-5 text-yellow-400" />
            GAME token holders enjoy exclusive discounts!
          </p>
        </div>
        <Card className="bg-gradient-to-br from-gray-900/90 to-slate-900/90 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">Your Cart</CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <p className="text-center text-gray-400">Your cart is empty.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.shop_items.images[1] || "/placeholder.svg"}
                            alt={item.shop_items.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-primary">{item.shop_items.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-primary">{item.size}</TableCell>
                      <TableCell className="text-primary">{item.color}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, Number.parseInt(e.target.value))}
                          className="w-20 bg-background/50 text-primary"
                        />
                      </TableCell>
                      <TableCell className="text-primary">${item.shop_items.price.toFixed(2)}</TableCell>
                      <TableCell className="text-primary">
                        {(item.quantity * item.shop_items.price).toFixed(2)} GAME
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 className="h-4 w-4 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-2xl font-bold text-primary">Total: ${calculateTotal().toFixed(2)}</div>
            <Button
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

