"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contexts/user-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { createTeam } from "@/lib/service-team"
import { addTeamMember } from "@/lib/service-team"

const formSchema = z.object({
  name: z.string().min(3, { message: "Team name must be at least 3 characters" }),
  console: z.string().min(1, { message: "Platform is required" }),
  header_image: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  logo_image: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" })
    .optional()
    .or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

export function CreateTeamForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { player } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      console: "",
      header_image: "",
      logo_image: "",
      description: "",
    },
  })

  async function onSubmit(values: FormValues) {
    if (!player) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to create a team.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const team = await createTeam({
        ...values,
        creator_id: player,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (team) {
        // Add the creator as a team member with owner role
        await addTeamMember({
          team_id: team.id,
          player_id: player,
          role: "owner",
          joined_at: new Date().toISOString(),
        })

        toast({
          title: "Team Created",
          description: "Your team has been created successfully!",
        })
        router.push(`/teams/${team.id}`)
      } else {
        toast({
          title: "Error",
          description: "Failed to create team. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating team:", error)
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
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Create Team</CardTitle>
        <CardDescription>Form a new team to compete in tournaments together</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team name" {...field} />
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
                    <FormLabel>Primary Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PC">PC</SelectItem>
                        <SelectItem value="PlayStation">PlayStation</SelectItem>
                        <SelectItem value="Xbox">Xbox</SelectItem>
                        <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                        <SelectItem value="Cross-platform">Cross-platform</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="header_image"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Team Header Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/header.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Recommended size: 1500x500 pixels. This will be displayed at the top of your team page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormDescription>Square image recommended. This will be your team's avatar.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your team, your goals, and what games you specialize in..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] text-black font-bold py-3 rounded-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
              {isSubmitting ? "Creating Team..." : "Create Team"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

