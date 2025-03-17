"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Search, Sparkles, Filter, Star, Loader2 } from "lucide-react"
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
  url_friendly_id: number
  description: string
  featured: boolean
  discount: number
}

export function ShopMobile() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [featuredItems, setFeaturedItems] = useState<ShopItem[]>([])
  const [showFilters, setShowFilters] = useState(false)
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
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground pt-20">
      <main className="container mx-auto px-4 py-4">
        {/* Hero Section */}
        <ScrollReveal>
          <section className="mb-6 relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 z-0"></div>
            <div className="absolute inset-0 bg-[url('/placeholder.svg?height=300&width=600')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
            <div className="relative z-10 py-8 px-4 text-center">
              <h1 className="text-3xl font-bold mb-2 text-white">Gamerholic Shop</h1>
              <p className="text-sm text-gray-200 mb-4">Exclusive merchandise for the Gamerholic community</p>
              <Button
                className="bg-[#111] hover:bg-[#222] text-white border border-[#00FFA9] rounded-full relative overflow-hidden group text-sm h-9"
                onClick={() => document.getElementById("featured-mobile")?.scrollIntoView({ behavior: "smooth" })}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-50 transition-opacity"></span>
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-transparent opacity-30 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                <span className="relative">Browse Products</span>
              </Button>
            </div>
          </section>
        </ScrollReveal>

        {/* Token Benefits Section */}
        <ScrollReveal>
          <section className="mb-6">
            <Card className="bg-gradient-to-r from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#00FFA9]/20 to-[#00C3FF]/20 p-2 rounded-full">
                    <Sparkles className="h-6 w-6 text-[#00FFA9]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold mb-1 text-primary">GAME Token Benefits</h2>
                    <p className="text-xs text-gray-400 mb-2">The more GAME tokens you hold, the more you save!</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-black/40 rounded-lg p-2 border border-primary/10">
                        <p className="text-xs text-gray-400">100+ GAME</p>
                        <p className="text-sm font-bold text-primary">5% Off</p>
                      </div>
                      <div className="bg-black/40 rounded-lg p-2 border border-primary/10">
                        <p className="text-xs text-gray-400">500+ GAME</p>
                        <p className="text-sm font-bold text-primary">10% Off</p>
                      </div>
                      <div className="bg-black/40 rounded-lg p-2 border border-primary/10">
                        <p className="text-xs text-gray-400">1000+ GAME</p>
                        <p className="text-sm font-bold text-primary">15% Off</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </ScrollReveal>

        {/* Search and Filter */}
        <ScrollReveal>
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-primary">Shop Products</h2>
              <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-5 w-5 text-primary" />
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-3 mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-[#111] border-primary/20 text-sm h-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full bg-[#111] border-primary/20 text-sm h-9">
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
            )}
          </section>
        </ScrollReveal>

        {/* Featured Items */}
        <ScrollReveal>
          <section id="featured-mobile" className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-primary">Featured Items</h2>
              <Button
                variant="link"
                className="text-primary text-xs p-0 h-auto"
                onClick={() => setCategoryFilter("all")}
              >
                View All
              </Button>
            </div>
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex space-x-3">
                {featuredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="w-[220px] flex-shrink-0 bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={item.images[0] || "/placeholder.svg?height=160&width=220"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-[#FF007A] text-white text-xs font-bold px-2 py-0.5 rounded">
                          {item.discount}% OFF
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-sm font-bold text-primary mb-1 truncate">{item.name}</h3>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-black/50 text-primary border-primary text-xs">
                          {item.category}
                        </Badge>
                        <div className="text-xs font-bold">
                          {item.discount > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="line-through text-gray-400 text-[10px]">
                                {item.price.toFixed(2)} GAME
                              </span>
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
                    <CardFooter className="p-3 pt-0">
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8"
                        onClick={() => router.push(`/shop/${item.url_friendly_id}`)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </section>
        </ScrollReveal>

        {/* All Items */}
        <ScrollReveal>
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">All Products</h2>

            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No items found matching your criteria.</p>
                <Button
                  variant="link"
                  className="text-primary mt-1 text-xs"
                  onClick={() => {
                    setSearchTerm("")
                    setCategoryFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-gradient-to-br from-[#111] to-[#0D0D0D] border border-primary/20 overflow-hidden"
                    onClick={() => router.push(`/shop/${item.url_friendly_id}`)}
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={item.images[0] || "/placeholder.svg?height=144&width=180"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.discount > 0 && (
                        <div className="absolute top-1 right-1 bg-[#FF007A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {item.discount}% OFF
                        </div>
                      )}
                      {item.featured && (
                        <div className="absolute top-1 left-1 bg-[#00FFA9] text-black text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">
                          <Star className="h-2 w-2 mr-0.5" /> Hot
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <h3 className="text-xs font-bold text-primary mb-1 truncate">{item.name}</h3>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="bg-black/50 text-primary border-primary text-[10px] px-1 py-0"
                        >
                          {item.category}
                        </Badge>
                        <div className="text-xs font-bold">
                          {item.discount > 0 ? (
                            <div className="flex items-center">
                              <span className="line-through text-gray-400 text-[10px] mr-1">
                                {item.price.toFixed(2)}
                              </span>
                              <span className="text-[#00FFA9]">
                                {(item.price * (1 - item.discount / 100)).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-primary">{item.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </ScrollReveal>
      </main>
    </div>
  )
}

