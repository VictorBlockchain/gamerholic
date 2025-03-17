"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export function TournamentEditModal({ tournament, isOpen, onClose, onSuccess }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: tournament.title || "",
    rules: tournament.rules || "",
    start_date: tournament.start_date ? new Date(tournament.start_date).toISOString().split("T")[0] : "",
    start_time: tournament.start_time || "18:00",
    entry_fee: tournament.entry_fee || 0,
    gamer_to_join: tournament.gamer_to_join || 0,
    prize_percentage: tournament.prize_percentage || 100,
    first_place_percentage: tournament.first_place_percentage || 70,
    second_place_percentage: tournament.second_place_percentage || 20,
    third_place_percentage: tournament.third_place_percentage || 10,
    winner_take_all: tournament.winner_take_all || false,
    image_url: tournament.image_url || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Only allow editing if tournament is in "upcoming" status
  const canEdit = tournament.status === "upcoming"

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSwitchChange = (name, checked) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!canEdit) {
      toast({
        title: "Cannot Edit",
        description: "This tournament cannot be edited because it has already started or is completed.",
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

      const { error } = await supabase
        .from("tournaments")
        .update({
          title: formData.title,
          rules: formData.rules,
          start_date: startDateTime.toISOString(),
          start_time: formData.start_time,
          entry_fee: Number(formData.entry_fee),
          gamer_to_join: Number(formData.gamer_to_join),
          prize_percentage: Number(formData.prize_percentage),
          first_place_percentage: Number(formData.first_place_percentage),
          second_place_percentage: Number(formData.second_place_percentage),
          third_place_percentage: Number(formData.third_place_percentage),
          winner_take_all: formData.winner_take_all,
          image_url: formData.image_url,
        })
        .eq("game_id", tournament.game_id)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Tournament updated successfully.",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error updating tournament:", error)
      toast({
        title: "Error",
        description: "Failed to update tournament. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canEdit) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[#111] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cannot Edit Tournament</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>This tournament cannot be edited because it has already started or is completed.</p>
          </div>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-[#333] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Tournament</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tournament Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="bg-[#222] border-[#444]"
              required
            />
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
              <Label htmlFor="entry_fee">Entry Fee ({tournament.money === 1 ? "SOL" : "GAMER"})</Label>
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

            <div className="space-y-2">
              <Label htmlFor="gamer_to_join">GAMER to Join</Label>
              <Input
                id="gamer_to_join"
                name="gamer_to_join"
                type="number"
                min="0"
                value={formData.gamer_to_join}
                onChange={handleChange}
                className="bg-[#222] border-[#444]"
                required
              />
            </div>
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
            <Label htmlFor="image_url">Tournament Image URL</Label>
            <Input
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="bg-[#222] border-[#444]"
              placeholder="https://example.com/image.jpg"
            />
          </div>

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

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#00FFA9] hover:bg-[#00D48F] text-black font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

