"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share,
  Star,
  Truck,
  ShieldCheck,
  Sparkles,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

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
  featured: boolean
  discount: number
  specifications?: Record<string, string>
}

export function ProductDetailMobile() {
  const [item, setItem] = useState<ShopItem | null>(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [relatedItems, setRelatedItems] = useState<ShopItem[]>([])
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, player, profile } = useUser()

  useEffect(() => {
    fetchItem()
  }, [params.id])

  const fetchItem = async () => {
    setIsLoading(true)
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

      // Fetch related items
      fetchRelatedItems(data.category)
    }
    setIsLoading(false)
  }

  const fetchRelatedItems = async (category: string) => {
    const { data, error } = await supabase
      .from("shop_items")
      .select("*")
      .eq("category", category)
      .neq("url_friendly_id", params.id)
      .limit(4)

    if (!error && data) {
      const itemsWithValidImages = data.map((item) => ({
        ...item,
        images: item.images.filter((url) => url && !url.includes("undefined")),
      }))
      setRelatedItems(itemsWithValidImages)
    }
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? (item?.images.length || 1) - 1 : prevIndex - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === (item?.images.length || 1) - 1 ? 0 : prevIndex + 1))
  }

  const handleAddToCart = async () => {
    if (!item) return

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to add items to your cart.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Added to Cart",
      description: `${quantity} ${item.name} added to your cart.`,
    })
  }

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return price * (1 - discount / 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground pt-20">
        <div className="container mx-auto p-4 space-y-4">
          <h1 className="text-xl font-bold text-center text-primary">Product Not Found</h1>
          <Button onClick={() => router.push("/shop")} className="mx-auto block">
            Return to Shop
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground pt-20">
      <main className="container mx-auto px-4 py-4">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4 p-0 h-8" onClick={() => router.push("/shop")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Shop
        </Button>

        <ScrollReveal>
          {/* Product Images */}
          <div className="relative bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 rounded-lg overflow-hidden mb-4">
            <img
              src={item.images[currentImageIndex] || "/placeholder.svg?height=400&width=400"}
              alt={`${item.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-[300px] object-contain p-4"
            />
            {item.images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/50 border-primary/20 text-primary hover:bg-black/70 h-8 w-8"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/50 border-primary/20 text-primary hover:bg-black/70 h-8 w-8"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            {item.discount > 0 && (
              <div className="absolute top-2 right-2 bg-[#FF007A] text-white text-xs font-bold px-2 py-1 rounded-full">
                {item.discount}% OFF
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {item.images.length > 1 && (
            <ScrollArea className="w-full whitespace-nowrap mb-4">
              <div className="flex space-x-2">
                {item.images.map((image, index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 cursor-pointer border-2 ${
                      index === currentImageIndex ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image || "/placeholder.svg?height=64&width=64"}
                      alt={`${item.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </ScrollReveal>

        <ScrollReveal>
          {/* Product Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="bg-black/50 text-primary border-primary text-xs">
                {item.category}
              </Badge>
              {item.featured && (
                <Badge className="bg-[#00FFA9] text-black text-xs flex items-center">
                  <Star className="h-3 w-3 mr-1" /> Featured
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-primary mb-2">{item.name}</h1>

            <div className="flex items-center mb-3">
              {item.discount > 0 ? (
                <div className="flex items-center">
                  <span className="text-xl font-bold text-[#00FFA9] mr-2">
                    {calculateDiscountedPrice(item.price, item.discount).toFixed(2)} GAME
                  </span>
                  <span className="text-sm line-through text-gray-400">{item.price.toFixed(2)} GAME</span>
                </div>
              ) : (
                <span className="text-xl font-bold text-primary">{item.price.toFixed(2)} GAME</span>
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          {/* Token Benefits */}
          <Card className="bg-gradient-to-r from-[#111] to-[#0D0D0D] border border-primary/20 mb-4">
            <CardContent className="p-3">
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 text-[#00FFA9] mr-2 flex-shrink-0" />
                <p className="text-xs text-primary">GAME token holders enjoy exclusive discounts!</p>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal>
          {/* Product Options */}
          <div className="space-y-4 mb-6">
            {/* Size Selection */}
            {item.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex space-x-2">
                    {item.sizes.map((size) => (
                      <Button
                        key={size}
                        type="button"
                        variant={selectedSize === size ? "default" : "outline"}
                        className={`h-9 min-w-[2.5rem] flex-shrink-0 ${
                          selectedSize === size
                            ? "bg-primary text-primary-foreground"
                            : "text-primary border-primary/30"
                        }`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Color Selection */}
            {item.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex space-x-2">
                    {item.colors.map((color) => (
                      <Button
                        key={color}
                        type="button"
                        variant={selectedColor === color ? "default" : "outline"}
                        className={`h-9 flex-shrink-0 ${
                          selectedColor === color
                            ? "bg-primary text-primary-foreground"
                            : "text-primary border-primary/30"
                        }`}
                        onClick={() => setSelectedColor(color)}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-primary/30 text-primary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={item.stock_quantity}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.min(Math.max(1, Number.parseInt(e.target.value) || 1), item.stock_quantity))
                  }
                  className="w-12 h-9 mx-2 text-center bg-[#111] border-primary/30 text-primary"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-primary/30 text-primary"
                  onClick={() => setQuantity(Math.min(quantity + 1, item.stock_quantity))}
                  disabled={quantity >= item.stock_quantity}
                >
                  +
                </Button>
                <span className="ml-2 text-xs text-gray-400">{item.stock_quantity} available</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          {/* Action Buttons */}
          <div className="flex space-x-2 mb-6">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            <Button variant="outline" className="w-10 h-10 p-0 border-primary/30 text-primary">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-10 h-10 p-0 border-primary/30 text-primary">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          {/* Shipping Info */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="flex items-center bg-black/30 p-2 rounded-lg border border-primary/10">
              <Truck className="h-4 w-4 text-primary mr-2" />
              <div>
                <p className="text-xs font-medium text-primary">Free Shipping</p>
                <p className="text-[10px] text-gray-400">Orders over 50 GAME</p>
              </div>
            </div>
            <div className="flex items-center bg-black/30 p-2 rounded-lg border border-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary mr-2" />
              <div>
                <p className="text-xs font-medium text-primary">NFT Included</p>
                <p className="text-[10px] text-gray-400">Proof of authenticity</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          {/* Product Details Tabs */}
          <Tabs defaultValue="details" className="mb-6">
            <TabsList className="bg-[#111] border border-primary/20 rounded-lg p-1 w-full">
              <TabsTrigger
                value="details"
                className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Specs
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Shipping
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-3">
              <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
                <CardContent className="p-3">
                  <h3 className="text-sm font-bold text-primary mb-2">Product Details</h3>
                  <p className="text-xs text-gray-300 mb-2">{item.description}</p>
                  <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                    <li>Premium quality materials</li>
                    <li>Official Gamerholic merchandise</li>
                    <li>Includes digital NFT certificate</li>
                    <li>Limited edition design</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-3">
              <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
                <CardContent className="p-3">
                  <h3 className="text-sm font-bold text-primary mb-2">Specifications</h3>
                  <div className="space-y-1">
                    {item.specifications ? (
                      Object.entries(item.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b border-gray-700 py-1">
                          <span className="text-xs text-gray-400">{key}</span>
                          <span className="text-xs text-primary">{value}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between border-b border-gray-700 py-1">
                          <span className="text-xs text-gray-400">Material</span>
                          <span className="text-xs text-primary">100% Cotton</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-700 py-1">
                          <span className="text-xs text-gray-400">Weight</span>
                          <span className="text-xs text-primary">180 gsm</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-700 py-1">
                          <span className="text-xs text-gray-400">Care</span>
                          <span className="text-xs text-primary">Machine wash cold</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-700 py-1">
                          <span className="text-xs text-gray-400">Origin</span>
                          <span className="text-xs text-primary">Made in USA</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping" className="mt-3">
              <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
                <CardContent className="p-3">
                  <h3 className="text-sm font-bold text-primary mb-2">Shipping & Returns</h3>
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-xs font-semibold text-primary mb-1">Shipping</h4>
                      <p className="text-xs text-gray-300 mb-1">Free shipping on all orders over 50 GAME tokens.</p>
                      <ul className="list-disc list-inside text-xs text-gray-300">
                        <li>Standard: 3-5 business days</li>
                        <li>Express: 1-2 business days</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-primary mb-1">Returns</h4>
                      <p className="text-xs text-gray-300 mb-1">30-day returns for a full refund or exchange.</p>
                      <ul className="list-disc list-inside text-xs text-gray-300">
                        <li>Items must be unworn</li>
                        <li>Original condition required</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollReveal>

        {/* Related Products */}
        {relatedItems.length > 0 && (
          <ScrollReveal>
            <section>
              <h2 className="text-lg font-bold text-primary mb-3">You May Also Like</h2>
              <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex space-x-3">
                  {relatedItems.map((relatedItem) => (
                    <Card
                      key={relatedItem.id}
                      className="w-[160px] flex-shrink-0 bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden"
                      onClick={() => router.push(`/shop/${relatedItem.url_friendly_id}`)}
                    >
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={relatedItem.images[0] || "/placeholder.svg?height=128&width=160"}
                          alt={relatedItem.name}
                          className="w-full h-full object-cover"
                        />
                        {relatedItem.discount > 0 && (
                          <div className="absolute top-1 right-1 bg-[#FF007A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {relatedItem.discount}% OFF
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <h3 className="text-xs font-bold text-primary mb-1 truncate">{relatedItem.name}</h3>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="bg-black/50 text-primary border-primary text-[10px] px-1 py-0"
                          >
                            {relatedItem.category}
                          </Badge>
                          <div className="text-xs font-bold text-primary">
                            {relatedItem.discount > 0
                              ? (relatedItem.price * (1 - relatedItem.discount / 100)).toFixed(2)
                              : relatedItem.price.toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </section>
          </ScrollReveal>
        )}
      </main>
    </div>
  )
}

