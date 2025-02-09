"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Header } from "@/components/header"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Search, Sparkles } from "lucide-react"
import { Loader2 } from "lucide-react"

interface ShopItem {
  id: string
  name: string
  price: number
  category: string
  images: string[]
  sizes: string[]
  colors: string[]
  url_friendly_id: number
}

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const { data, error } = await supabase.from("shop_items").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching shop items:", error)
    } else {
      // Filter out invalid or undefined image URLs for each item
      const itemsWithValidImages =
        data?.map((item) => ({
          ...item,
          images: item.images.filter((url) => url && !url.includes("undefined")),
        })) || []
      setItems(itemsWithValidImages)
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

  const categories = ["Short Sleeve Shirt", "Long Sleeve Shirt", "Hoodie", "Wool Hat", "Baseball Cap"]

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
      <div className="container mx-auto p-4 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Gamerholic Shop</h1>
          <p className="text-xl text-secondary-foreground">Get your exclusive Gamerholic merch!</p>
        </div>
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-8 shadow-2xl mb-8">
          <h2 className="text-3xl font-bold mb-4 text-primary text-center flex items-center justify-center">
            <Sparkles className="w-8 h-8 mr-2 text-yellow-400" />
            Exclusive GAME Token Holder Benefits
          </h2>
          <p className="text-lg mb-4 text-center max-w-2xl mx-auto text-gray-300">
            The more GAME tokens you hold, the more you save! Enjoy exclusive discounts and early access to new
            merchandise.
          </p>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by category" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col bg-gradient-to-br from-gray-900/90 to-slate-900/90 border-primary/20 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              <CardHeader>
                <img
                  src={item.images[0] || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              </CardHeader>
              <CardContent className="flex-grow">
                <CardTitle className="mb-2 text-primary">{item.name}</CardTitle>
                <Badge variant="secondary" className="mb-2">
                  {item.category}
                </Badge>
                <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/shop/${item.url_friendly_id}`)}
                  className="w-full mr-2"
                >
                  View Details
                </Button>
                <Button className="w-full ml-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

