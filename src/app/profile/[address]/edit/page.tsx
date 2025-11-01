'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Crown, Edit2, Target, User, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useGamerProfile } from '@/context/GamerProfileContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function ProfileAddressEditPage() {
  const params = useParams() as { address?: string }
  const router = useRouter()
  const { address: selfAddress, profile, updateProfile } = useGamerProfile()
  const { toast } = useToast()
  const target = (params.address ?? '').toLowerCase()
  const isSelf = !!selfAddress && target === String(selfAddress).toLowerCase()

  useEffect(() => {
    if (!isSelf) {
      router.replace(`/profile/${target}`)
    }
  }, [isSelf, router, target])

  // Form state seeded from context
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '')
  const [coverUrl, setCoverUrl] = useState(profile?.coverUrl || '')
  const [team, setTeam] = useState((profile as any)?.team || '')
  const [role, setRole] = useState((profile as any)?.role || '')
  const [region, setRegion] = useState((profile as any)?.region || '')
  const socials = useMemo(() => (profile?.socials || {}) as any, [profile?.socials])
  const [twitter, setTwitter] = useState(socials?.twitter || '')
  const [discord, setDiscord] = useState(socials?.discord || '')
  const [twitch, setTwitch] = useState(socials?.twitch || '')
  const [youtube, setYoutube] = useState(socials?.youtube || '')
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const AVATAR_BUCKET = 'avatars'
  const COVER_BUCKET = 'covers'

  const isHttpUrl = (url: string) => {
    try {
      const u = new URL(url)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  const uploadImage = async (kind: 'avatar' | 'cover', file: File) => {
    try {
      const isAvatar = kind === 'avatar'
      if (isAvatar) {
        setUploadingAvatar(true)
      } else {
        setUploadingCover(true)
      }

      const bucket = isAvatar ? AVATAR_BUCKET : COVER_BUCKET
      const wallet = String(selfAddress || target).toLowerCase()
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const path = `${wallet}/${kind}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type })
      if (upErr) throw upErr

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const publicUrl = data?.publicUrl
      if (!publicUrl) throw new Error('Failed to resolve public URL')

      if (isAvatar) {
        setAvatarUrl(publicUrl)
        setAvatarError(false)
      } else {
        setCoverUrl(publicUrl)
        setCoverError(false)
      }
      toast({ title: 'Uploaded', description: `Your ${kind} has been uploaded.` })
    } catch (e: any) {
      toast({
        title: 'Upload failed',
        description: e?.message || 'Unable to upload image',
        variant: 'destructive',
      })
    } finally {
      setUploadingAvatar(false)
      setUploadingCover(false)
    }
  }

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImage('avatar', file)
    // Reset the input so selecting the same file again re-triggers change
    e.target.value = ''
  }

  const onCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImage('cover', file)
    e.target.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const trimmedUsername = username.trim()
      const currentUsername = profile?.username || ''
      const usernameChanged = trimmedUsername !== currentUsername

      // If username changed, ensure it's not already taken by another gamer
      if (usernameChanged) {
        const selfWallet = String(selfAddress || '').toLowerCase()
        const { data: existingUsers, error: existingErr } = await supabase
          .from('gamers')
          .select('wallet')
          .eq('username', trimmedUsername)
          .neq('wallet', selfWallet)
          .limit(1)

        if (existingErr) throw existingErr
        if (existingUsers && existingUsers.length > 0) {
          toast({
            title: 'Username already taken',
            description: 'Please choose a different username.',
            variant: 'destructive',
          })
          setSaving(false)
          return
        }
      }
      // Build a minimal diff payload
      const originalSocials = socials || {}
      const payload: Record<string, any> = {}

      if (trimmedUsername !== (profile?.username || '')) payload.username = trimmedUsername
      if (bio !== (profile?.bio || '')) payload.bio = bio
      if (avatarUrl !== (profile?.avatarUrl || '')) payload.avatar_url = avatarUrl || null
      if (coverUrl !== (profile?.coverUrl || '')) payload.cover_url = coverUrl || null
      if (team !== ((profile as any)?.team || '')) payload.team = team || null
      if (role !== ((profile as any)?.role || '')) payload.role = role || null
      if (region !== ((profile as any)?.region || '')) payload.region = region || null

      const socialsChanged =
        twitter !== (originalSocials.twitter || '') ||
        discord !== (originalSocials.discord || '') ||
        twitch !== (originalSocials.twitch || '') ||
        youtube !== (originalSocials.youtube || '')

      if (socialsChanged) payload.socials = { twitter, discord, twitch, youtube }

      if (Object.keys(payload).length === 0) {
        toast({ title: 'No changes', description: 'Nothing to save.' })
        setConfirmOpen(false)
        return
      }

      // Update local profile state
      updateProfile({
        username: trimmedUsername,
        bio,
        avatarUrl,
        coverUrl,
        team,
        role,
        region,
        socials: { twitter, discord, twitch, youtube },
      })

      // Persist to Supabase (best-effort)
      if (selfAddress) {
        const { error } = await supabase
          .from('gamers')
          .update({
            username: trimmedUsername,
            bio,
            avatar_url: avatarUrl || null,
            cover_url: coverUrl || null,
            team: team || null,
            role: role || null,
            region: region || null,
            socials: { twitter, discord, twitch, youtube },
          })
          .eq('wallet', String(selfAddress).toLowerCase())
        if (error) throw error
      }

      toast({ title: 'Profile updated', description: 'Your changes have been saved.' })
      setConfirmOpen(false)
      router.replace(`/profile/${target}`)
    } catch (e: any) {
      toast({
        title: 'Save failed',
        description: e?.message || 'Unable to save changes',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Keep form values in sync if profile loads/changes asynchronously
  useEffect(() => {
    setUsername(profile?.username || '')
    setBio(profile?.bio || '')
    setAvatarUrl(profile?.avatarUrl || '')
    setCoverUrl(profile?.coverUrl || '')
    setTeam((profile as any)?.team || '')
    setRole((profile as any)?.role || '')
    setRegion((profile as any)?.region || '')
    const s = (profile?.socials || {}) as any
    setTwitter(s?.twitter || '')
    setDiscord(s?.discord || '')
    setTwitch(s?.twitch || '')
    setYoutube(s?.youtube || '')
  }, [profile])

  if (!isSelf) {
    return (
      <div className="min-h-screen bg-black text-white">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
          <div className="relative container mx-auto px-4 py-6 sm:py-8">
            <div className="mb-6 text-center sm:mb-8">
              <div className="mb-3 flex items-center justify-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 sm:h-12 sm:w-12">
                  <User className="h-4 w-4 text-white sm:h-6 sm:w-6" />
                </div>
                <h1 className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl md:text-5xl">
                  Edit Profile
                </h1>
              </div>
              <p className="text-base font-medium text-amber-400 sm:text-lg">
                You can only edit your own profile
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-8">
          <Card className="border-gray-800 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <Edit2 className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Access Denied</h3>
              </div>
              <p className="mb-4 text-gray-300">
                You tried to edit another gamer’s profile. Head back to view mode.
              </p>
              <Link href={`/profile/${target}`}>
                <Button
                  variant="outline"
                  className="border-amber-600 text-amber-400 hover:bg-amber-500/20"
                >
                  Go to profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Owner: render on-page edit form under /profile/{address}/edit
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-950 via-black to-orange-950 pt-24 pb-8 text-white">
      {/* Subtle background particles (same pattern as tournament create) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + Math.random() * 3}s`,
            }}
          >
            <div
              className={cn(
                'h-2 w-2 rounded-full opacity-30',
                i % 3 === 0 ? 'bg-amber-500' : i % 3 === 1 ? 'bg-orange-500' : 'bg-yellow-500',
              )}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4">
        {/* Gaming Header (copied style) */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/profile/${target}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl border border-amber-500/30 bg-amber-500/20 text-amber-400 transition-all duration-300 hover:scale-105 hover:bg-amber-500/30 hover:text-amber-300"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-600">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 blur-lg" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
                  EDIT PROFILE
                </h1>
                <p className="text-sm font-medium tracking-wider text-amber-300/70">
                  UPDATE GAMER DETAILS
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gaming Form (copied structure) */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Conditional Preview Profile Card (only shown when user uploads avatar or cover) */}
          {(() => {
            const previewAvatar = isHttpUrl(avatarUrl) ? avatarUrl : profile?.avatarUrl || ''
            const previewCover = isHttpUrl(coverUrl) ? coverUrl : profile?.coverUrl || ''
            const showPreview = isHttpUrl(avatarUrl) || isHttpUrl(coverUrl)
            if (!showPreview) return null
            return (
              <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold tracking-wider text-amber-400">
                    PROFILE PREVIEW
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative h-40 overflow-hidden rounded-xl sm:h-48">
                    {previewCover ? (
                      <img
                        src={previewCover}
                        alt="Cover preview"
                        className="absolute inset-0 h-full w-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/30 via-orange-600/20 to-yellow-600/30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
                    <div className="absolute -bottom-6 left-6 flex items-center gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-500/60 shadow-lg shadow-amber-500/20 sm:h-20 sm:w-20">
                        {previewAvatar ? (
                          <img
                            src={previewAvatar}
                            alt="Avatar preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-amber-600/30" />
                        )}
                      </div>
                      <div className="text-amber-300">
                        <div className="text-sm font-bold">
                          {username || profile?.username || 'gamer'}
                        </div>
                        <div className="text-xs opacity-70">
                          {region || (profile as any)?.region || ''}
                        </div>
                      </div>
                    </div>
                    <div className="h-6" />
                  </div>
                </CardContent>
              </Card>
            )
          })()}
          {/* Profile Configuration Card */}
          <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
            {/* Animated top border */}
            <div className="absolute top-0 right-0 left-0 h-1 animate-pulse bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500" />

            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold text-amber-400">
                <div className="relative">
                  <Crown className="h-6 w-6" />
                  <div className="absolute inset-0 h-6 w-6 animate-pulse bg-amber-500 blur-lg" />
                </div>
                <span>PROFILE CONFIGURATION</span>
                <Zap className="h-5 w-5 animate-pulse text-orange-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-amber-300">
                  <Target className="h-4 w-4" />
                  <span>USERNAME</span>
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  className={cn(
                    'border-amber-500/30 bg-black/50 text-amber-100 placeholder-amber-300/30',
                    'transition-all duration-300 focus:border-amber-500 focus:ring-amber-500/20',
                    'hover:border-amber-500/50',
                  )}
                  disabled={saving}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <label className="mb-2 block text-sm font-bold tracking-wider text-amber-300">
                    BIO
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about your playstyle and achievements"
                    rows={4}
                    className={cn(
                      'resize-none border-amber-500/30 bg-black/50 text-amber-100 placeholder-amber-300/30',
                      'transition-all duration-300 focus:border-amber-500 focus:ring-amber-500/20',
                      'hover:border-amber-500/50',
                    )}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Assets & Socials Card */}
          <Card className="relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
            {/* Animated top border */}
            <div className="absolute top-0 right-0 left-0 h-1 animate-pulse bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500" />

            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold text-orange-400">
                <div className="relative">
                  <Edit2 className="h-6 w-6" />
                  <div className="absolute inset-0 h-6 w-6 animate-pulse bg-orange-500 blur-lg" />
                </div>
                <span>PROFILE CONTENT</span>
                <Zap className="h-5 w-5 animate-pulse text-amber-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="mb-2 block text-sm font-bold tracking-wider text-orange-300">
                    AVATAR
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onAvatarPick}
                    />
                    <Button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={saving || uploadingAvatar}
                      className={cn(
                        'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700',
                        'rounded-md px-3 py-1 text-xs transition-all duration-300',
                        uploadingAvatar && 'animate-pulse',
                      )}
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <label className="mb-2 block text-sm font-bold tracking-wider text-orange-300">
                    HEADER IMAGE
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onCoverPick}
                    />
                    <Button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={saving || uploadingCover}
                      className={cn(
                        'bg-gradient-to-r from-yellow-500 to-orange-700 text-white hover:from-yellow-600 hover:to-orange-800',
                        'rounded-md px-3 py-1 text-xs transition-all duration-300',
                        uploadingCover && 'animate-pulse',
                      )}
                    >
                      {uploadingCover ? 'Uploading...' : 'Upload Header'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="mb-2 block text-sm font-bold tracking-wider text-orange-300">
                  SOCIALS
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Input
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="Twitter @handle"
                    className={cn(
                      'border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                      'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                      'hover:border-orange-500/50',
                    )}
                    disabled={saving}
                  />
                  <Input
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="Discord username#1234"
                    className={cn(
                      'border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                      'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                      'hover:border-orange-500/50',
                    )}
                    disabled={saving}
                  />
                  <Input
                    value={twitch}
                    onChange={(e) => setTwitch(e.target.value)}
                    placeholder="Twitch channel"
                    className={cn(
                      'border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                      'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                      'hover:border-orange-500/50',
                    )}
                    disabled={saving}
                  />
                  <Input
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="YouTube channel URL"
                    className={cn(
                      'border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                      'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                      'hover:border-orange-500/50',
                    )}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit & Confirmation (mirrors tournament pattern) */}
          <div className="flex flex-col items-center space-y-3" aria-busy={saving}>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    'relative bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-3 font-bold tracking-wider text-white transition-all duration-300 hover:from-amber-700 hover:to-orange-700',
                    'hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/50',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    saving && 'animate-pulse',
                  )}
                >
                  {saving ? (
                    <span className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>SAVING...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <Crown className="h-5 w-5" />
                      <span>SAVE PROFILE</span>
                      <Zap className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border border-amber-500/30 bg-black/90">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-amber-300">
                    Confirm Profile Update
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-amber-200/70">
                    Review details and confirm to save your profile changes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 text-sm text-amber-100">
                  <div>
                    <span className="text-amber-300">Username:</span> {username}
                  </div>
                  <div>
                    <span className="text-amber-300">Region:</span> {region}
                  </div>
                  <div>
                    <span className="text-amber-300">Team:</span> {team}
                  </div>
                  <div>
                    <span className="text-amber-300">Role:</span> {role}
                  </div>
                  <div>
                    <span className="text-amber-300">Avatar:</span> {avatarUrl || 'None'}
                  </div>
                  <div>
                    <span className="text-amber-300">Cover:</span> {coverUrl || 'None'}
                  </div>
                  <div>
                    <span className="text-amber-300">Twitter:</span> {twitter || 'None'}
                  </div>
                  <div>
                    <span className="text-amber-300">Discord:</span> {discord || 'None'}
                  </div>
                  <div>
                    <span className="text-amber-300">Twitch:</span> {twitch || 'None'}
                  </div>
                  <div>
                    <span className="text-amber-300">YouTube:</span> {youtube || 'None'}
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border border-amber-500/30 bg-black/60 text-amber-200">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-gradient-to-r from-amber-600 to-orange-600 text-white"
                    onClick={handleSave}
                  >
                    Confirm & Save
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>

        {saving && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-amber-300">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
              <span>Saving changes...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
