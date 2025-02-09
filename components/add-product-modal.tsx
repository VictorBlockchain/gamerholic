"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload } from "lucide-react"

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (productData: any) => void
  editingProduct: any | null
}

export function AddProductModal({ isOpen, onClose, onSubmit, editingProduct }: AddProductModalProps) {
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    sizes: [],
    colors: [],
    stock_quantity: "",
    images: [],
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingProduct) {
      setProductData(editingProduct)
      setImagePreviews(editingProduct.images || [])
    } else {
      resetForm()
    }
  }, [editingProduct])

  const resetForm = () => {
    setProductData({
      name: "",
      description: "",
      price: "",
      category: "",
      sizes: [],
      colors: [],
      stock_quantity: "",
      images: [],
    })
    setImageFiles([])
    setImagePreviews([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProductData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setProductData((prev) => ({ ...prev, [name]: value }))
  }

  const handleArrayChange = (name: string, value: string) => {
    const array = value.split(",").map((item) => item.trim())
    setProductData((prev) => ({ ...prev, [name]: array }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImageFiles((prevFiles) => [...prevFiles, ...files])

    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setImageFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
    setImagePreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    Object.entries(productData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, value.toString())
      }
    })
    imageFiles.forEach((file) => {
      formData.append("images", file)
    })
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] bg-gradient-to-br from-teal-900/90 to-emerald-900/90 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={productData.name}
              onChange={handleChange}
              className="bg-background/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={productData.description}
              onChange={handleChange}
              className="bg-background/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={productData.price}
              onChange={handleChange}
              className="bg-background/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => handleSelectChange("category", value)} value={productData.category}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Short Sleeve Shirt">Short Sleeve Shirt</SelectItem>
                <SelectItem value="Long Sleeve Shirt">Long Sleeve Shirt</SelectItem>
                <SelectItem value="Hoodie">Hoodie</SelectItem>
                <SelectItem value="Wool Hat">Wool Hat</SelectItem>
                <SelectItem value="Baseball Cap">Baseball Cap</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sizes">Sizes (comma-separated)</Label>
            <Input
              id="sizes"
              name="sizes"
              value={productData.sizes.join(", ")}
              onChange={(e) => handleArrayChange("sizes", e.target.value)}
              className="bg-background/50"
              placeholder="S, M, L, XL"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="colors">Colors (comma-separated)</Label>
            <Input
              id="colors"
              name="colors"
              value={productData.colors.join(", ")}
              onChange={(e) => handleArrayChange("colors", e.target.value)}
              className="bg-background/50"
              placeholder="Red, Blue, Green"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock_quantity">Stock Quantity</Label>
            <Input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              value={productData.stock_quantity}
              onChange={handleChange}
              className="bg-background/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="images">Product Images</Label>
            <div className="flex flex-wrap gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 flex flex-col items-center justify-center bg-background/50 border-2 border-dashed border-primary rounded-md"
              >
                <Upload size={24} />
                <span className="text-xs mt-2">Add Image</span>
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{editingProduct ? "Update Product" : "Add Product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

