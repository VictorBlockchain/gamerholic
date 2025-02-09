"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Header } from "@/components/header"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ShoppingCart, ChevronLeft, ChevronRight, Eye, CheckCircle, Sparkles } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"

interface ShopItem {
  id: string
  name: string
  price: number
  category: string
  images: string[]
  sizes: string[]
  colors: string[]
  description: string
  stock_quantity: number
  url_friendly_id: number
}

export default function ProductDetailPage() {
  const [item, setItem] = useState<ShopItem | null>(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddedToCartModalOpen, setIsAddedToCartModalOpen] = useState(false)
  const params = useParams()
  const router = useRouter()
  const { publicKey } = useWallet()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchItem()
  }, [])

  const fetchItem = async () => {
    const { data, error } = await supabase.from("shop_items").select("*").eq("url_friendly_id", params.id).single()

    if (error) {
      console.error("Error fetching shop item:", error)
      toast({
        title: "Error",
        description: "Failed to load product details. Please try again.",
        variant: "destructive",
      })
    } else {
      // Filter out invalid or undefined image URLs
      const validImages = data.images.filter((url) => url && !url.includes("undefined"))
      setItem({ ...data, images: validImages })
      if (data.sizes.length > 0) setSelectedSize(data.sizes[0])
      if (data.colors.length > 0) setSelectedColor(data.colors[0])
    }
    setIsLoading(false)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? (item?.images.length || 1) - 1 : prevIndex - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === (item?.images.length || 1) - 1 ? 0 : prevIndex + 1))
  }

  const handleAddToCart = async () => {
    if (!item) return

    if (!publicKey) {
      toast({
        title: "Error",
        description: "Please connect your wallet to add items to your cart.",
        variant: "destructive",
      })
      return
    }

    const { data: existingCartItem, error: fetchError } = await supabase
      .from("cart")
      .select("*")
      .eq("public_key", publicKey.toString())
      .eq("item_id", item.id)
      .eq("size", selectedSize)
      .eq("color", selectedColor)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching cart item:", fetchError)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (existingCartItem) {
      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: existingCartItem.quantity + quantity })
        .eq("id", existingCartItem.id)

      if (updateError) {
        console.error("Error updating cart item:", updateError)
        toast({
          title: "Error",
          description: "Failed to update cart. Please try again.",
          variant: "destructive",
        })
        return
      }
    } else {
      const { error: insertError } = await supabase.from("cart").insert({
        public_key: publicKey.toString(),
        item_id: item.id,
        quantity: quantity,
        size: selectedSize,
        color: selectedColor,
      })

      if (insertError) {
        console.error("Error inserting cart item:", insertError)
        toast({
          title: "Error",
          description: "Failed to add item to cart. Please try again.",
          variant: "destructive",
        })
        return
      }
    }
    
    setIsAddedToCartModalOpen(true)
  }
  
  const handleViewCart = () => {
    router.push("/shop/cart")
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

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
        <Header />
        <div className="container mx-auto p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">Product Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-8 shadow-2xl mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 text-center">Get Your Gamerholic Merch!</h1>
          <p className="text-xl text-secondary-foreground text-center mb-4">
            Shipped fast! All merch comes with a proof of authenticity NFT
          </p>
          <p className="text-lg text-center text-primary/80">
            <Sparkles className="inline-block mr-2 h-5 w-5 text-yellow-400" />
            The more GAME tokens you hold, the more you save!
          </p>
        </div>
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900/90 to-slate-900/90 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">{item.name}</CardTitle>
            <Badge variant="secondary" className="text-lg">
              {item.category}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative">
              <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogTrigger asChild>
                  <img
                    src={item.images[currentImageIndex] || "/placeholder.svg"}
                    alt={`${item.name} - Image ${currentImageIndex + 1}`}
                    className={`w-full h-96 object-cover rounded-lg ${item.images.length > 1 ? "cursor-pointer" : ""}`}
                  />
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                    {item.images.length > 1 && (
                      <DialogDescription>
                        Image {currentImageIndex + 1} of {item.images.length}
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  <img
                    src={item.images[currentImageIndex] || "/placeholder.svg"}
                    alt={`${item.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-auto object-contain"
                  />
                </DialogContent>
              </Dialog>
              {item.images.length > 1 ? (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 left-2 transform -translate-y-1/2"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 right-2 transform -translate-y-1/2"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="flex justify-center mt-4 space-x-2">
                    {item.images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full ${index === currentImageIndex ? "bg-primary" : "bg-gray-300"}`}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <div className="space-y-6">
              <p className="text-3xl font-bold text-primary">{item.price.toFixed(2)} GAMEr</p>
              <p className="text-gray-400">{item.description}</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="size-select" className="block text-sm font-medium text-gray-400 mb-1">
                    Size
                  </label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger id="size-select">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {item.sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="color-select" className="block text-sm font-medium text-gray-400 mb-1">
                    Color
                  </label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger id="color-select">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {item.colors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-400 mb-1">
                    Quantity
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={item.stock_quantity}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.min(Math.max(1, Number.parseInt(e.target.value)), item.stock_quantity))
                    }
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/shop")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Button>
            <div className="space-x-2">
              <Button onClick={handleViewCart} variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                View Cart
              </Button>
              <Button onClick={handleAddToCart} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      <Dialog open={isAddedToCartModalOpen} onOpenChange={setIsAddedToCartModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Added to Cart
            </DialogTitle>
          </DialogHeader>
          <p>
            {quantity} {item.name} ({selectedSize}, {selectedColor}) has been added to your cart.
          </p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsAddedToCartModalOpen(false)}>
              Continue Shopping
            </Button>
            <Button onClick={handleViewCart}>View Cart</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

