import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"

export function UserProfileDialog({
  showUserNameModal,
  setShowUserNameModal,
  userData,
  setUserData,
  handleSetUserName,
}) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      // You might want to add logic here to upload the file to your server or cloud storage
    }
  }
  
  return (
    <Dialog open={showUserNameModal} onOpenChange={() => setShowUserNameModal(false)}>
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
                  <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : undefined} />
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
            </CardContent>
          </Card>
          
          <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-primary mb-2">3. Generate Deposit Address</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Click 'Update Profile' to generate your unique deposit address.
              </p>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button onClick={() => setShowUserNameModal(false)} variant="outline">
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
  )
}

