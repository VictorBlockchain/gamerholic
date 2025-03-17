"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contexts/user-context"
import { createTournament } from "@/lib/service-tourmanent"
import { supabase } from "@/lib/supabase"
import { ErrorModal } from "@/components/modals/error-modal"
import { SuccessModal } from "@/components/modals/success-modal"
import { CalendarIcon, Trophy, Upload } from "lucide-react"
import moment from "moment-timezone";

export function CreateTournamentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, player } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    game: "",
    console: "",
    entry_fee: 0,
    prize_percentage: 100,
    first_place_percentage: 70,
    second_place_percentage: 20,
    third_place_percentage: 10,
    rules:
      "1. All participants must be registered on Gamerholic.\n2. Matches must be played at the scheduled time.\n3. Screenshots of match results must be submitted.\n4. Unsportsmanlike conduct will result in disqualification.\n5. Tournament host's decisions are final.",
    start_date: "",
    start_time: "18:00",
    max_players: 8,
    image_url: "",
    type: 1, // 1 = bracket, 2 = custom
    winner_take_all: false,
    gamer_to_join: 0,
    money: 2, // 1 = SOL, 2 = GAMER
    is_team_tournament: false,
  })
  const [previewImage, setPreviewImage] = useState("/placeholder.svg")
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSelectChange = (name:any, value:any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (name:any, checked:any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage.from("images").upload(fileName, file)
      
      if (error) {
        setErrorMessage("Failed to upload image. Please try again.")
        setErrorModalOpen(true)
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(fileName)
        
        setPreviewImage(publicUrl)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAuthenticated || !player) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to create a tournament.",
        variant: "destructive",
      })
      return
    }

    // Validate percentages
    if (!formData.winner_take_all) {
      const totalPercentage =
        Number(formData.first_place_percentage) +
        Number(formData.second_place_percentage) +
        Number(formData.third_place_percentage)

      if (totalPercentage !== 100) {
        toast({
          title: "Invalid Percentages",
          description: "The sum of prize percentages must equal 100%.",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)
    try {
      // Combine date and time
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`)
          // Combine start_date and start_time into a single string
    const dateTimeString = `${formData.start_date}T${formData.start_time}`;

    // Parse the combined string using Moment.js
    const momentDateTime = moment.tz(dateTimeString, "YYYY-MM-DDTHH:mm", "America/New_York"); // Replace with your desired timezone
    // Convert to a timestamp (in milliseconds)
    const timestamp = momentDateTime.valueOf();
    const isoString = moment(timestamp).toISOString();
      console.log(isoString)
      const tournamentData:any = {
        title: formData.title,
        game: formData.game,
        console: formData.console,
        entry_fee: Number(formData.entry_fee),
        prize_percentage: Number(formData.prize_percentage),
        first_place_percentage: Number(formData.first_place_percentage),
        second_place_percentage: Number(formData.second_place_percentage),
        third_place_percentage: Number(formData.third_place_percentage),
        rules: formData.rules,
        start_time: isoString,
        max_players: Number(formData.max_players),
        image_url: previewImage,
        status: "upcoming",
        host_id: player,
        winner_take_all: formData.winner_take_all,
        type: Number(formData.type),
        gamer_to_join: Number(formData.gamer_to_join),
        money: Number(formData.money),
        is_team_tournament: formData.is_team_tournament,
      }

      const result = await createTournament(tournamentData)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.message || "Failed to create tournament.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Tournament created successfully!",
        })

        // Redirect to the tournament page
        if (result.tournamentId) {
          router.push(`/tournaments/${result.tournamentId}`)
        } else {
          router.push("/tournaments")
        }
      }
    } catch (error) {
      console.error("Error creating tournament:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-[#111] border-[#333] text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create Tournament</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Tournament Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="bg-[#222] border-[#444]"
              placeholder="Enter tournament title"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="game">Game</Label>
              <Input
                id="game"
                name="game"
                value={formData.game}
                onChange={handleChange}
                className="bg-[#222] border-[#444]"
                placeholder="e.g. Call of Duty, FIFA 23"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="console">Platform</Label>
              <Select value={formData.console} onValueChange={(value) => handleSelectChange("console", value)}>
                <SelectTrigger className="bg-[#222] border-[#444]">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-[#444]">
                  <SelectItem value="PC">PC</SelectItem>
                  <SelectItem value="PlayStation">PlayStation</SelectItem>
                  <SelectItem value="Xbox">Xbox</SelectItem>
                  <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Cross-platform">Cross-platform</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                className="bg-[#222] border-[#444]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={handleChange}
                className="bg-[#222] border-[#444]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tournament Type</Label>
              <Select
                value={formData.type.toString()}
                onValueChange={(value) => handleSelectChange("type", Number(value))}
              >
                <SelectTrigger className="bg-[#222] border-[#444]">
                  <SelectValue placeholder="Select tournament type" />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-[#444]">
                  <SelectItem value="1">Bracket (Single Elimination)</SelectItem>
                  <SelectItem value="2">Custom Format</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_players">Max Participants</Label>
              <Select
                value={formData.max_players.toString()}
                onValueChange={(value) => handleSelectChange("max_players", Number(value))}
              >
                <SelectTrigger className="bg-[#222] border-[#444]">
                  <SelectValue placeholder="Select max players" />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-[#444]">
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="32">32</SelectItem>
                  <SelectItem value="64">64</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_team_tournament"
              checked={formData.is_team_tournament}
              onCheckedChange={(checked) => handleSwitchChange("is_team_tournament", checked)}
            />
            <Label htmlFor="is_team_tournament">Team Tournament</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="money">Currency</Label>
              <Select
                value={formData.money.toString()}
                onValueChange={(value) => handleSelectChange("money", Number(value))}
              >
                <SelectTrigger className="bg-[#222] border-[#444]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-[#444]">
                  <SelectItem value="1">SOL</SelectItem>
                  <SelectItem value="2">GAMER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_fee">Entry Fee</Label>
              <Input
                id="entry_fee"
                name="entry_fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.entry_fee}
                onChange={handleChange}
                className="bg-[#222] border-[#444]"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gamer_to_join">GAMER to Join (optional)</Label>
            <Input
              id="gamer_to_join"
              name="gamer_to_join"
              type="number"
              min="0"
              value={formData.gamer_to_join}
              onChange={handleChange}
              className="bg-[#222] border-[#444]"
            />
            <p className="text-xs text-gray-400">
              Amount of GAMER tokens required to join the tournament (in addition to entry fee).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prize_percentage">Prize Pool Percentage (%)</Label>
            <Input
              id="prize_percentage"
              name="prize_percentage"
              type="number"
              min="1"
              max="100"
              value={formData.prize_percentage}
              onChange={handleChange}
              className="bg-[#222] border-[#444]"
              required
            />
            <p className="text-xs text-gray-400">Percentage of entry fees that go to the prize pool.</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="winner_take_all"
              checked={formData.winner_take_all}
              onCheckedChange={(checked) => handleSwitchChange("winner_take_all", checked)}
            />
            <Label htmlFor="winner_take_all">Winner Takes All</Label>
          </div>

          {!formData.winner_take_all && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_place_percentage">1st Place (%)</Label>
                <Input
                  id="first_place_percentage"
                  name="first_place_percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.first_place_percentage}
                  onChange={handleChange}
                  className="bg-[#222] border-[#444]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="second_place_percentage">2nd Place (%)</Label>
                <Input
                  id="second_place_percentage"
                  name="second_place_percentage"
                  type="number"
                  min="0"
                  max="99"
                  value={formData.second_place_percentage}
                  onChange={handleChange}
                  className="bg-[#222] border-[#444]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="third_place_percentage">3rd Place (%)</Label>
                <Input
                  id="third_place_percentage"
                  name="third_place_percentage"
                  type="number"
                  min="0"
                  max="99"
                  value={formData.third_place_percentage}
                  onChange={handleChange}
                  className="bg-[#222] border-[#444]"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="image_url">Tournament Image URL (optional)</Label>
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
                {previewImage && <p className="text-sm text-muted-foreground">Image uploaded successfully</p>}
              </div>
          </div>
          {previewImage && (
            <div className="space-y-2">
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardContent>
                  <img
                    src={previewImage || "/placeholder.svg"}
                    alt="Tournament Preview"
                    className="w-full h-64 object-cover rounded-lg mb-4 mt-4"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rules">Tournament Rules</Label>
            <Textarea
              id="rules"
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              className="bg-[#222] border-[#444] min-h-[150px]"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black font-bold"
            disabled={isSubmitting || !isAuthenticated}
          >
            {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
            {isSubmitting ? "Creating Tournament..." : "Create Tournament"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

