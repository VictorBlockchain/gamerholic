import { supabase } from "./supabase"

export interface Team {
  id: string
  name: string
  console: string
  header_image: string | null
  logo_image: string | null
  creator_id: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  player_id: string
  role: "owner" | "admin" | "member"
  joined_at: string
  player_name?: string
  player_avatar?: string
}

export interface TeamInvitation {
  id: string
  team_id: string
  player_id: string
  invited_by: string
  status: "pending" | "accepted" | "declined"
  created_at: string
  updated_at: string
}

// Get all teams
export async function getTeams(limit = 20): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching teams:", error)
    return []
  }

  return data || []
}

// Get team by ID
export async function getTeamById(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase.from("teams").select("*").eq("id", teamId).single()

  if (error) {
    console.error("Error fetching team:", error)
    return null
  }

  return data
}
// Get touranment teas

export async function getPlayerTeams(playerId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("creator_id", playerId)
    .order("created_at", { ascending: false })
  
  if (error) {
    console.error("Error fetching player teams:", error)
    return []
  }

  return data || []
}

// Get teams created by a player
export async function getPlayerTeams(playerId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("creator_id", playerId)
    .order("created_at", { ascending: false })
  
  if (error) {
    console.error("Error fetching player teams:", error)
    return []
  }

  return data || []
}

// Get teams a player is a member of
export async function getPlayerTeamMemberships(playerId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select(`
      team_id,
      teams:team_id(*)
    `)
    .eq("player_id", playerId)

  if (error) {
    console.error("Error fetching player team memberships:", error)
    return []
  }

  // Extract the teams from the nested structure
  return data.map((item) => item.teams) || []
}

// Get team members
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select(`
      *,
      players:player_id(name, avatar)
    `)
    .eq("team_id", teamId)

  if (error) {
    console.error("Error fetching team members:", error)
    return []
  }

  // Format the response to include player name and avatar
  return (
    data.map((member) => ({
      ...member,
      player_name: member.players?.name,
      player_avatar: member.players?.avatar,
    })) || []
  )
}

// Create a new team
export async function createTeam(teamData: Partial<Team>): Promise<Team | null> {
  const { data, error } = await supabase.from("teams").insert(teamData).select()

  if (error) {
    console.error("Error creating team:", error)
    return null
  }

  return data[0] || null
}

// Update team
export async function updateTeam(teamId: string, updates: Partial<Team>): Promise<boolean> {
  const { error } = await supabase.from("teams").update(updates).eq("id", teamId)

  if (error) {
    console.error("Error updating team:", error)
    return false
  }

  return true
}

// Add team member
export async function addTeamMember(teamMemberData: Partial<TeamMember>): Promise<boolean> {
  const { error } = await supabase.from("team_members").insert(teamMemberData)

  if (error) {
    console.error("Error adding team member:", error)
    return false
  }

  return true
}

// Remove team member
export async function removeTeamMember(teamId: string, playerId: string): Promise<boolean> {
  const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("player_id", playerId)

  if (error) {
    console.error("Error removing team member:", error)
    return false
  }

  return true
}

// Update team member role
export async function updateTeamMemberRole(teamId: string, playerId: string, role: string): Promise<boolean> {
  const { error } = await supabase.from("team_members").update({ role }).eq("team_id", teamId).eq("player_id", playerId)

  if (error) {
    console.error("Error updating team member role:", error)
    return false
  }

  return true
}

// Create team invitation
export async function createTeamInvitation(invitationData: Partial<TeamInvitation>): Promise<boolean> {
  const { error } = await supabase.from("team_invitations").insert(invitationData)

  if (error) {
    console.error("Error creating team invitation:", error)
    return false
  }

  return true
}

// Get player's pending invitations
export async function getPlayerInvitations(playerId: string): Promise<TeamInvitation[]> {
  const { data, error } = await supabase
    .from("team_invitations")
    .select(`
      *,
      teams:team_id(name, logo_image),
      inviters:invited_by(name, avatar)
    `)
    .eq("player_id", playerId)
    .eq("status", "pending")

  if (error) {
    console.error("Error fetching player invitations:", error)
    return []
  }

  return data || []
}

// Respond to team invitation
export async function respondToInvitation(invitationId: string, status: "accepted" | "declined"): Promise<boolean> {
  const { error } = await supabase.from("team_invitations").update({ status }).eq("id", invitationId)

  if (error) {
    console.error("Error responding to invitation:", error)
    return false
  }

  // If accepted, add the player to the team
  if (status === "accepted") {
    const { data: invitation } = await supabase.from("team_invitations").select("*").eq("id", invitationId).single()

    if (invitation) {
      await addTeamMember({
        team_id: invitation.team_id,
        player_id: invitation.player_id,
        role: "member",
      })
    }
  }

  return true
}

// Check if player is a team member
export async function isPlayerTeamMember(teamId: string, playerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("player_id", playerId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

// Get team achievements
export async function getTeamAchievements(teamId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("team_achievements")
    .select(`
      *,
      tournaments:tournament_id(title, game)
    `)
    .eq("team_id", teamId)
    .order("achievement_date", { ascending: false })

  if (error) {
    console.error("Error fetching team achievements:", error)
    return []
  }

  return data || []
}

