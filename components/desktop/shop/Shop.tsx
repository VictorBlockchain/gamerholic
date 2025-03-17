"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingCart, Search, Sparkles, Star, Loader2 } from "lucide-react"
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
  url_friendly_id: number
  description: string
  featured: boolean
  discount: number
}

export function ShopDesktop() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [featuredItems, setFeaturedItems] = useState<ShopItem[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, player, profile } = useUser()

  // Categories
  const categories = ["Short Sleeve Shirt", "Long Sleeve Shirt", "Hoodie", "Wool Hat", "Baseball Cap"]

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("shop_items").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching shop items:", error)
      toast({
        title: "Error",
        description: "Failed to load shop items. Please try again.",
        variant: "destructive",
      })
    } else {
      // Filter out invalid or undefined image URLs for each item
      const itemsWithValidImages =
        data?.map((item) => ({
          ...item,
          images: item.images.filter((url) => url && !url.includes("undefined")),
        })) || []

      setItems(itemsWithValidImages)

      // Set featured items
      const featured = itemsWithValidImages.filter((item) => item.featured)
      setFeaturedItems(featured.length > 0 ? featured.slice(0, 3) : itemsWithValidImages.slice(0, 3))
    }
    setIsLoading(false)
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [items, searchTerm, categoryFilter])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 z-0"></div>
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="relative z-10 py-16 px-8 text-center">
            <h1 className="text-5xl font-bold mb-4 text-white">Gamerholic Shop</h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Exclusive merchandise for the Gamerholic community. Show your passion with our premium quality apparel.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                className="bg-[#111] hover:bg-[#222] text-white border border-[#00FFA9] rounded-full relative overflow-hidden group"
                onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-50 transition-opacity"></span>
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-transparent opacity-30 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                <span className="relative">Featured Items</span>
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => document.getElementById("all-items")?.scrollIntoView({ behavior: "smooth" })}
              >
                Browse All
              </Button>
            </div>
          </div>
        </section>

        {/* Token Benefits Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 bg-grid-8 mix-blend-overlay pointer-events-none"></div>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 bg-gradient-to-br from-[#00FFA9]/20 to-[#00C3FF]/20 p-4 rounded-full">
                  <Sparkles className="h-12 w-12 text-[#00FFA9]" />
                </div>
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold mb-2 text-primary">GAME Token Holder Benefits</h2>
                  <p className="text-gray-400 mb-4">
                    The more GAME tokens you hold, the more you save! Enjoy exclusive discounts and early access to new
                    merchandise.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-black/40 rounded-lg p-3 border border-primary/10">
                      <p className="text-sm text-gray-400">Hold 100+ GAME</p>
                      <p className="text-xl font-bold text-primary">5% Discount</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-primary/10">
                      <p className="text-sm text-gray-400">Hold 500+ GAME</p>
                      <p className="text-xl font-bold text-primary">10% Discount</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-primary/10">
                      <p className="text-sm text-gray-400">Hold 1000+ GAME</p>
                      <p className="text-xl font-bold text-primary">15% Discount</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Featured Items */}
        <section id="featured" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-primary">Featured Items</h2>
            <Button variant="link" className="text-primary" onClick={() => setCategoryFilter("all")}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <Card
                key={item.id}
                className="group bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden hover:border-primary/50 transition-all duration-300"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={item.images[0] || "/placeholder.svg?height=256&width=384"}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {item.discount > 0 && (
                    <div className="absolute top-2 right-2 bg-[#FF007A] text-white text-sm font-bold px-2 py-1 rounded">
                      {item.discount}% OFF
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-black/50 text-primary border-primary">
                        {item.category}
                      </Badge>
                      <div className="text-lg font-bold text-white">
                        {item.discount > 0 ? (
                          <div className="flex items-center">
                            <span className="line-through text-gray-400 text-sm mr-2">
                              {item.price.toFixed(2)} GAME
                            </span>
                            <span className="text-[#00FFA9]">
                              {(item.price * (1 - item.discount / 100)).toFixed(2)} GAME
                            </span>
                          </div>
                        ) : (
                          <span>{item.price.toFixed(2)} GAME</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <CardFooter className="p-4 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/shop/${item.url_friendly_id}`)}
                    className="flex-1 mr-2"
                  >
                    Details
                  </Button>
                  <Button className="flex-1 ml-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* All Items */}
        <section id="all-items">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-3xl font-bold text-primary">All Products</h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#111] border-primary/20"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-[#111] border-primary/20">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">No items found matching your criteria.</p>
              <Button
                variant="link"
                className="text-primary mt-2"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="group bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden hover:border-primary/50 transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.images[0] || "/placeholder.svg?height=192&width=256"}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {item.discount > 0 && (
                      <div className="absolute top-2 right-2 bg-[#FF007A] text-white text-sm font-bold px-2 py-1 rounded">
                        {item.discount}% OFF
                      </div>
                    )}
                    {item.featured && (
                      <div className="absolute top-2 left-2 bg-[#00FFA9] text-black text-sm font-bold px-2 py-1 rounded flex items-center">
                        <Star className="h-3 w-3 mr-1" /> Featured
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold text-primary mb-1 truncate">{item.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="bg-black/50 text-primary border-primary text-xs">
                        {item.category}
                      </Badge>
                      <div className="text-sm font-bold">
                        {item.discount > 0 ? (
                          <div className="flex items-center">
                            <span className="line-through text-gray-400 text-xs mr-1">{item.price.toFixed(2)}</span>
                            <span className="text-[#00FFA9]">
                              {(item.price * (1 - item.discount / 100)).toFixed(2)} GAME
                            </span>
                          </div>
                        ) : (
                          <span className="text-primary">{item.price.toFixed(2)} GAME</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/shop/${item.url_friendly_id}`)}
                      className="flex-1 mr-2 text-xs h-9"
                    >
                      Details
                    </Button>
                    <Button className="flex-1 ml-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9">
                      <ShoppingCart className="mr-1 h-3 w-3" /> Add
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

