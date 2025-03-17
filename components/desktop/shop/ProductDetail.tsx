"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"

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

export function ProductDetailDesktop() {
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
      description: `${quantity} ${item.name} (${selectedSize}, ${selectedColor}) added to your cart.`,
    })
  }

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return price * (1 - discount / 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
        <div className="container mx-auto p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center text-primary">Product Not Found</h1>
          <Button onClick={() => router.push("/shop")} className="mx-auto block">
            Return to Shop
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-400 mb-6">
          <Button variant="link" className="p-0 h-auto text-gray-400" onClick={() => router.push("/shop")}>
            Shop
          </Button>
          <ChevronRight className="h-4 w-4 mx-1" />
          <Button
            variant="link"
            className="p-0 h-auto text-gray-400"
            onClick={() => router.push(`/shop?category=${item.category}`)}
          >
            {item.category}
          </Button>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-primary">{item.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 rounded-lg overflow-hidden">
              <img
                src={item.images[currentImageIndex] || "/placeholder.svg?height=600&width=600"}
                alt={`${item.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-[500px] object-contain p-4"
              />
              {item.images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/50 border-primary/20 text-primary hover:bg-black/70"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/50 border-primary/20 text-primary hover:bg-black/70"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {item.discount > 0 && (
                <div className="absolute top-4 right-4 bg-[#FF007A] text-white font-bold px-3 py-1 rounded-full">
                  {item.discount}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {item.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {item.images.map((image, index) => (
                  <div
                    key={index}
                    className={`w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 ${
                      index === currentImageIndex ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image || "/placeholder.svg?height=80&width=80"}
                      alt={`${item.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-black/50 text-primary border-primary mb-2">
                  {item.category}
                </Badge>
                {item.featured && (
                  <Badge className="bg-[#00FFA9] text-black mb-2 flex items-center">
                    <Star className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">{item.name}</h1>

              <div className="flex items-center mb-4">
                {item.discount > 0 ? (
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-[#00FFA9] mr-3">
                      {calculateDiscountedPrice(item.price, item.discount).toFixed(2)} GAME
                    </span>
                    <span className="text-xl line-through text-gray-400">{item.price.toFixed(2)} GAME</span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-primary">{item.price.toFixed(2)} GAME</span>
                )}
              </div>

              <p className="text-gray-300 mb-6">{item.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center bg-black/30 p-3 rounded-lg border border-primary/10">
                  <Truck className="h-5 w-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm font-medium text-primary">Free Shipping</p>
                    <p className="text-xs text-gray-400">On all orders over 50 GAME</p>
                  </div>
                </div>
                <div className="flex items-center bg-black/30 p-3 rounded-lg border border-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm font-medium text-primary">NFT Authenticity</p>
                    <p className="text-xs text-gray-400">Includes proof of authenticity NFT</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {/* Size Selection */}
                {item.sizes.length > 0 && (
                  <div>
                    <label htmlFor="size-select" className="block text-sm font-medium text-gray-300 mb-2">
                      Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {item.sizes.map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant={selectedSize === size ? "default" : "outline"}
                          className={`h-10 min-w-[3rem] ${
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
                  </div>
                )}

                {/* Color Selection */}
                {item.colors.length > 0 && (
                  <div>
                    <label htmlFor="color-select" className="block text-sm font-medium text-gray-300 mb-2">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {item.colors.map((color) => (
                        <Button
                          key={color}
                          type="button"
                          variant={selectedColor === color ? "default" : "outline"}
                          className={`h-10 ${
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
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 border-primary/30 text-primary"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={item.stock_quantity}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.min(Math.max(1, Number.parseInt(e.target.value) || 1), item.stock_quantity))
                      }
                      className="w-16 h-10 mx-2 text-center bg-[#111] border-primary/30 text-primary"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 border-primary/30 text-primary"
                      onClick={() => setQuantity(Math.min(quantity + 1, item.stock_quantity))}
                      disabled={quantity >= item.stock_quantity}
                    >
                      +
                    </Button>
                    <span className="ml-3 text-sm text-gray-400">{item.stock_quantity} available</span>
                  </div>
                </div>
              </div>

              {/* Token Benefits */}
              <Card className="bg-gradient-to-r from-[#111] to-[#0D0D0D] border border-primary/20 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 text-[#00FFA9] mr-2" />
                    <p className="text-sm text-primary">
                      GAME token holders enjoy exclusive discounts! Hold more tokens for bigger savings.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button variant="outline" className="w-12 border-primary/30 text-primary">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" className="w-12 border-primary/30 text-primary">
                  <Share className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="details" className="mb-12">
          <TabsList className="bg-[#111] border border-primary/20 rounded-lg p-1">
            <TabsTrigger
              value="details"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="specifications"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Specifications
            </TabsTrigger>
            <TabsTrigger
              value="shipping"
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Shipping & Returns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-4">Product Details</h3>
                <p className="text-gray-300 mb-4">{item.description}</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Premium quality materials</li>
                  <li>Official Gamerholic merchandise</li>
                  <li>Includes digital NFT certificate of authenticity</li>
                  <li>Limited edition design</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications" className="mt-4">
            <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.specifications ? (
                    Object.entries(item.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-gray-700 py-2">
                        <span className="text-gray-400">{key}</span>
                        <span className="text-primary">{value}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between border-b border-gray-700 py-2">
                        <span className="text-gray-400">Material</span>
                        <span className="text-primary">100% Cotton</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-700 py-2">
                        <span className="text-gray-400">Weight</span>
                        <span className="text-primary">180 gsm</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-700 py-2">
                        <span className="text-gray-400">Care</span>
                        <span className="text-primary">Machine wash cold</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-700 py-2">
                        <span className="text-gray-400">Origin</span>
                        <span className="text-primary">Made in USA</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="mt-4">
            <Card className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-4">Shipping & Returns</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-primary mb-2">Shipping</h4>
                    <p className="text-gray-300 mb-2">
                      Free shipping on all orders over 50 GAME tokens. Standard shipping takes 3-5 business days.
                    </p>
                    <ul className="list-disc list-inside text-gray-300">
                      <li>Standard Shipping: 3-5 business days</li>
                      <li>Express Shipping: 1-2 business days (additional fee)</li>
                      <li>International Shipping: 7-14 business days</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-primary mb-2">Returns</h4>
                    <p className="text-gray-300 mb-2">
                      We accept returns within 30 days of delivery for a full refund or exchange.
                    </p>
                    <ul className="list-disc list-inside text-gray-300">
                      <li>Items must be unworn and in original condition</li>
                      <li>Return shipping is the responsibility of the customer</li>
                      <li>Refunds will be processed within 5-7 business days</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedItems.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-primary mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedItems.map((relatedItem) => (
                <Card
                  key={relatedItem.id}
                  className="group bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden hover:border-primary/50 transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={relatedItem.images[0] || "/placeholder.svg?height=192&width=256"}
                      alt={relatedItem.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {relatedItem.discount > 0 && (
                      <div className="absolute top-2 right-2 bg-[#FF007A] text-white text-sm font-bold px-2 py-1 rounded">
                        {relatedItem.discount}% OFF
                      </div>
                    )}
                    {relatedItem.featured && (
                      <div className="absolute top-2 left-2 bg-[#00FFA9] text-black text-sm font-bold px-2 py-1 rounded flex items-center">
                        <Star className="h-3 w-3 mr-1" /> Featured
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold text-primary mb-1 truncate">{relatedItem.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="bg-black/50 text-primary border-primary text-xs">
                        {relatedItem.category}
                      </Badge>
                      <div className="text-sm font-bold">
                        {relatedItem.discount > 0 ? (
                          <div className="flex items-center">
                            <span className="line-through text-gray-400 text-xs mr-1">
                              {relatedItem.price.toFixed(2)}
                            </span>
                            <span className="text-[#00FFA9]">
                              {(relatedItem.price * (1 - relatedItem.discount / 100)).toFixed(2)} GAME
                            </span>
                          </div>
                        ) : (
                          <span className="text-primary">{relatedItem.price.toFixed(2)} GAME</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      onClick={() => router.push(`/shop/${relatedItem.url_friendly_id}`)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

