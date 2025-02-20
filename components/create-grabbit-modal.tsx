import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { Upload, Coins } from "lucide-react"
import { supabase } from '@/lib/supabase'

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
  prizeType: z.enum(["Token", "Solana"]),
  tokenName: z.any().optional(),
  tokenAddress: z.any().optional(),
  minPlayers: z.number().min(2, { message: "Minimum 2 players required" }),
  maxPlayers: z.number().max(25, { message: "Maximum 25 players allowed" }),
  entryFee: z.number().min(0, { message: "Entry fee must be 0 or greater" }),

})

interface CreateGrabbitModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: z.infer<typeof formSchema>) => void
  publicKey: string
}

export function CreateGrabbitModal({ isOpen, onClose, onSubmit, publicKey }: CreateGrabbitModalProps) {
  const [imageFile, setImageFile] = useState()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      prizeType: "Solana",
      minPlayers: 2,
      maxPlayers: 10,
      entryFee: 0,
    },
  })
  
const handleImageUpload = async (event:any) => {
    const file = event.target.files?.[0];
    if (file) {
    const fileName = `${Date.now()}_${file.name}`; // Unique filename
    const { data, error } = await supabase.storage
        .from('images') // Your bucket name
        .upload(fileName, file);

    if (error) {
        console.error("Upload Error:", error);
    } else {
        console.log("File uploaded successfully:", data);
        let url:any = 'https://bwvzhdrrqvrdnmywdrlm.supabase.co/storage/v1/object/public/'+data.fullPath
        setImageFile(url)
    }
    }
};
  
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!imageFile) {
      toast({
        title: "Error",
        description: "Please upload an image for the game.",
        variant: "destructive",
      })
      return
    }
    if(!values.tokenAddress){
      values.tokenAddress = null
    }
    if(!values.tokenName){
      values.tokenName = null
    }
    onSubmit({ ...values, image: imageFile, publicKey: publicKey.toString() })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Create Grabbit Game</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter game title" {...field} className="bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </label>
                  {imageFile && <span className="text-sm text-primary-foreground">{imageFile.name}</span>}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter game description"
                      {...field}
                      className="bg-background/50 min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="prizeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select prize type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Solana">Solana</SelectItem>
                        <SelectItem value="Token">Token</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="prizeAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter prize amount"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        className="bg-background/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            {form.watch("prizeType") === "Token" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tokenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter token name" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tokenAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter token address" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minPlayers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Players</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Min players"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                        className="bg-background/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxPlayers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Players</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Max players"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                        className="bg-background/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="entryFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Fee</FormLabel>
                  <FormControl>
                  <Input
                    type="number"
                    step="0.01" // Allows decimal inputs with a step of 0.01
                    placeholder="Enter entry fee"
                    {...field}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || isNaN(Number(value))) {
                        field.onChange(null); // Handle empty or invalid input
                        } else {
                        field.onChange(Number.parseFloat(value)); // Parse as a float
                        }
                    }}
                    className="bg-background/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Coins className="mr-2 h-4 w-4" />
                Create Game
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

