import { supabase } from "@/lib/supabase"

export async function deductUserCredits(userId: string, amount: number): Promise<{ success: boolean }> {
  const { data, error } = await supabase.rpc("deduct_user_credits", {
    p_user_id: userId,
    p_amount: amount,
  })

  if (error) {
    console.error("Error deducting user credits:", error)
    return { success: false }
  }

  return { success: data }
}

