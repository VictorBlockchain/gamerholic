"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Trophy, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  game: z.string().min(1, "Game is required"),
  console: z.string().min(1, "Console is required"),
  entryFee: z.number().min(0, "Entry fee must be 0 or greater"),
  prizePercentage: z.number().min(1).max(100, "Prize percentage must be between 1 and 100"),
  firstPlacePercentage: z.number().min(1).max(100, "First place percentage must be between 1 and 100"),
  secondPlacePercentage: z.number().min(0).max(100, "Second place percentage must be between 0 and 100"),
  thirdPlacePercentage: z.number().min(0).max(100, "Third place percentage must be between 0 and 100"),
  rules: z.string().min(1, "Rules are required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  prizeType: z.enum(["Solana", "GAMEr"]),
  playerCount: z.enum(["4", "8", "16", "32", "64", "128"]),
  tournamentImage: z.string().url("Invalid URL").optional(),
})

export function TournamentForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState("/placeholder.svg")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      game: "",
      console: "",
      entryFee: 0,
      prizePercentage: 80,
      firstPlacePercentage: 60,
      secondPlacePercentage: 30,
      thirdPlacePercentage: 10,
      rules: "",
      prizeType: "GAMEr",
      playerCount: "16",
    },
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage.from("images").upload(fileName, file)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        })
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(fileName)

        setPreviewImage(publicUrl)
        form.setValue("tournamentImage", publicUrl)
      }
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // TODO: Implement the API call to create the tournament
      console.log(values)
      toast({
        title: "Tournament Created",
        description: "Your tournament has been successfully created.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating your tournament. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter tournament title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="game"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Game</FormLabel>
                <FormControl>
                  <Input placeholder="Enter game name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="console"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Console</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select console" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="PlayStation">PlayStation</SelectItem>
                    <SelectItem value="Xbox">Xbox</SelectItem>
                    <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entryFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Fee</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="prizePercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prize Percentage</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                </FormControl>
                <FormDescription>Percentage of entry fee that will go towards the prize</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="firstPlacePercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>1st Place Prize Percentage</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="secondPlacePercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>2nd Place Prize Percentage</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="thirdPlacePercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>3rd Place Prize Percentage</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rules</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter tournament rules" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select prize type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Solana">Solana</SelectItem>
                    <SelectItem value="GAMEr">GAMEr tokens</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="playerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Players</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of players" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="4">4 players</SelectItem>
                    <SelectItem value="8">8 players</SelectItem>
                    <SelectItem value="16">16 players</SelectItem>
                    <SelectItem value="32">32 players</SelectItem>
                    <SelectItem value="64">64 players</SelectItem>
                    <SelectItem value="128">128 players</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tournamentImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament Image</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors">
                        <Upload size={16} />
                        <span>Upload Image</span>
                      </div>
                    </label>
                    {field.value && <p className="text-sm text-muted-foreground">Image uploaded successfully</p>}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Tournament"}
          </Button>
        </form>
      </Form>
      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Tournament Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={previewImage || "/placeholder.svg"}
              alt="Tournament Preview"
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center">
              <Trophy className="mr-2" />
              Earn Crypto by Hosting Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-primary/80">
              As a tournament host, you'll receive a percentage of the entry fees collected. Create exciting
              tournaments, attract players, and earn crypto rewards for your efforts!
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <span className="bg-primary/20 rounded-full p-1 mr-2">✓</span>
                Earn a percentage of entry fees
              </li>
              <li className="flex items-center">
                <span className="bg-primary/20 rounded-full p-1 mr-2">✓</span>
                Build your reputation as a tournament organizer
              </li>
              <li className="flex items-center">
                <span className="bg-primary/20 rounded-full p-1 mr-2">✓</span>
                Create tournaments for your favorite games
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

