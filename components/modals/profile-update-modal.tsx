"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { updatePlayerProfile, uploadPlayerAvatar } from "@/lib/services"
import { useToast } from "@/components/ui/use-toast"
import { SuccessModal } from "./success-modal"
import { ErrorModal } from "./error-modal"

export interface UserData {
  id?: string
  name?: string
  avatar?: string
  player?: string
  email?: string
  x?: string
  tiktok?: string
  youtube?: string
  twitch?: string
  kick?: string
  last_online?: string
}

interface ProfileUpdateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userData: UserData
  setUserData: (userData: UserData) => void
  playerAddress: string
  onSuccess?: () => void
}

export function ProfileUpdateModal({
  open,
  onOpenChange,
  userData,
  setUserData,
  playerAddress,
  onSuccess,
}: ProfileUpdateModalProps) {
  const { toast } = useToast()
  const [avatarFile, setAvatarFile] = useState<string>("")
  const [showSocials, setShowSocials] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !playerAddress) return

    try {
      const url = await uploadPlayerAvatar(playerAddress, file)
      if (url) {
        setAvatarFile(url)
        setUserData({ ...userData, avatar: url })
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error("Upload Error:", error)
      setErrorMessage("There was an error uploading your avatar.")
      setShowErrorModal(true)
    }
  }

  const handleSetUserName = async () => {
    if (!playerAddress) return

    try {
      const success = await updatePlayerProfile(playerAddress, userData)

      if (success) {
        setShowSuccessModal(true)
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        setErrorMessage("There was an error updating your profile.")
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error("Update Error:", error)
      setErrorMessage("There was an error updating your profile.")
      setShowErrorModal(true)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-primary">Profile Setup</DialogTitle>
            <DialogDescription>Complete your profile in 3 easy steps</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-primary mb-2">1. Set Your Avatar</h3>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarFile || userData.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                      {userData.name ? userData.name[0].toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors">
                        <Upload size={16} />
                        <span>Upload Avatar</span>
                      </div>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-primary mb-2">2. Set Your Username</h3>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={userData.name || ""}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    placeholder="e.g. CyberNinja"
                    className="bg-background/50 border-primary/20"
                  />
                </div>
                <div className="grid gap-2 mt-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={userData.email || ""}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="bg-background/50 border-primary/20"
                  />
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline" 
                    className="w-full bg-background/50 border-primary/20 text-primary hover:bg-primary/10"
                    onClick={() => setShowSocials(prev => !prev)}
                  >
                    {showSocials ? 'Hide Social Links' : 'Add Social Links'}
                  </Button>
                </div>

                {showSocials && (
                  <>
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="x">X.com</Label>
                      <Input
                        id="x"
                        value={userData.x || ""}
                        onChange={(e) => setUserData({ ...userData, x: e.target.value })}
                        placeholder="@username"
                        className="bg-background/50 border-primary/20"
                      />
                    </div>
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="tiktok">TikTok</Label>
                      <Input
                        id="tiktok"
                        value={userData.tiktok || ""}
                        onChange={(e) => setUserData({ ...userData, tiktok: e.target.value })}
                        placeholder="@username"
                        className="bg-background/50 border-primary/20"
                      />
                    </div>
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        value={userData.youtube || ""}
                        onChange={(e) => setUserData({ ...userData, youtube: e.target.value })}
                        placeholder="channel name"
                        className="bg-background/50 border-primary/20"
                      />
                    </div>
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="twitch">Twitch</Label>
                      <Input
                        id="twitch"
                        value={userData.twitch || ""}
                        onChange={(e) => setUserData({ ...userData, twitch: e.target.value })}
                        placeholder="username"
                        className="bg-background/50 border-primary/20"
                      />
                    </div>
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="kick">Kick</Label>
                      <Input
                        id="kick"
                        value={userData.kick || ""}
                        onChange={(e) => setUserData({ ...userData, kick: e.target.value })}
                        placeholder="username"
                        className="bg-background/50 border-primary/20"
                      />
                    </div>
                  </>
                )}

              </CardContent>
            </Card>
            
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleSetUserName}
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Update Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal 
        open={showSuccessModal} 
        onOpenChange={setShowSuccessModal}
        title="Success"
        description="Your profile has been successfully updated."
      />

      <ErrorModal
        open={showErrorModal}
        onOpenChange={setShowErrorModal}
        title="Error"
        description={errorMessage}
      />
    </>
  )
}

