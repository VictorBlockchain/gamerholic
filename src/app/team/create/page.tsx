'use client'

import React, { useState } from 'react'
import { ArrowLeft, Users, Shield, Target, Hash, Mail, Zap, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function CreateTeamPage() {
  const [formData, setFormData] = useState({
    teamName: '',
    tag: '',
    description: '',
    maxMembers: '',
    requirements: '',
    contactEmail: ''
  })
  const [isAnimating, setIsAnimating] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Enhanced haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
    setIsAnimating(true)
    // TODO: Implement team creation logic
    console.log('Creating team:', formData)
    setTimeout(() => setIsAnimating(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 pt-24 pb-8 relative overflow-hidden">
      {/* Subtle background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${6 + Math.random() * 3}s`
            }}
          >
            <div className={cn(
              "w-2 h-2 rounded-full opacity-30",
              i % 3 === 0 ? "bg-purple-500" : i % 3 === 1 ? "bg-pink-500" : "bg-indigo-500"
            )} />
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 relative z-10">
        {/* Gaming Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center animate-pulse">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl blur-lg animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  CREATE TEAM
                </h1>
                <p className="text-purple-300/70 text-sm font-medium tracking-wider">BUILD YOUR SQUAD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gaming Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Information Card */}
          <Card className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md border-purple-500/20 overflow-hidden">
            {/* Animated top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-500 animate-pulse" />
            
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-purple-400 flex items-center space-x-3">
                <div className="relative">
                  <Shield className="h-6 w-6" />
                  <div className="absolute inset-0 h-6 w-6 bg-purple-500 blur-lg animate-pulse" />
                </div>
                <span>TEAM INFORMATION</span>
                <Zap className="h-5 w-5 text-pink-400 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <label className="text-purple-300 text-sm font-bold mb-2 block tracking-wider flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>TEAM NAME</span>
                </label>
                <Input
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  placeholder="Enter your team name..."
                  className={cn(
                    "bg-black/50 border-purple-500/30 text-purple-100 placeholder-purple-300/30",
                    "focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300",
                    "hover:border-purple-500/50"
                  )}
                  required
                />
              </div>
              
              <div className="relative">
                <label className="text-purple-300 text-sm font-bold mb-2 block tracking-wider flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>TEAM TAG</span>
                </label>
                <Input
                  name="tag"
                  value={formData.tag}
                  onChange={handleInputChange}
                  placeholder="e.g., [TEAM], XYZ"
                  maxLength={8}
                  className={cn(
                    "bg-black/50 border-purple-500/30 text-purple-100 placeholder-purple-300/30",
                    "focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300",
                    "hover:border-purple-500/50"
                  )}
                />
              </div>

              <div className="relative">
                <label className="text-purple-300 text-sm font-bold mb-2 block tracking-wider flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>TEAM DESCRIPTION</span>
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your team, goals, and what you're looking for..."
                  rows={3}
                  className={cn(
                    "bg-black/50 border-purple-500/30 text-purple-100 placeholder-purple-300/30 resize-none",
                    "focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300",
                    "hover:border-purple-500/50"
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Team Settings Card */}
          <Card className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md border-pink-500/20 overflow-hidden">
            {/* Animated top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-600 via-purple-500 to-indigo-500 animate-pulse" />
            
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-pink-400 flex items-center space-x-3">
                <div className="relative">
                  <Hash className="h-6 w-6" />
                  <div className="absolute inset-0 h-6 w-6 bg-pink-500 blur-lg animate-pulse" />
                </div>
                <span>TEAM SETTINGS</span>
                <Target className="h-5 w-5 text-purple-400 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <label className="text-pink-300 text-sm font-bold mb-2 block tracking-wider flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>MAX MEMBERS</span>
                </label>
                <Input
                  name="maxMembers"
                  type="number"
                  value={formData.maxMembers}
                  onChange={handleInputChange}
                  placeholder="5"
                  min="2"
                  max="20"
                  className={cn(
                    "bg-black/50 border-pink-500/30 text-pink-100 placeholder-pink-300/30",
                    "focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300",
                    "hover:border-pink-500/50"
                  )}
                />
              </div>

              <div className="relative">
                <label className="text-pink-300 text-sm font-bold mb-2 block tracking-wider flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>REQUIREMENTS</span>
                </label>
                <Textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  placeholder="What are you looking for in team members? (Skill level, availability, etc.)"
                  rows={3}
                  className={cn(
                    "bg-black/50 border-pink-500/30 text-pink-100 placeholder-pink-300/30 resize-none",
                    "focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300",
                    "hover:border-pink-500/50"
                  )}
                />
              </div>

              <div className="relative">
                <label className="text-pink-300 text-sm font-bold mb-2 block tracking-wider flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>CONTACT EMAIL</span>
                </label>
                <Input
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="team@example.com"
                  className={cn(
                    "bg-black/50 border-pink-500/30 text-pink-100 placeholder-pink-300/30",
                    "focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300",
                    "hover:border-pink-500/50"
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gaming Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href="/">
              <Button 
                variant="outline" 
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-300 transition-all duration-300 hover:scale-105"
              >
                CANCEL
              </Button>
            </Link>
            <Button 
              type="submit"
              disabled={isAnimating}
              className={cn(
                "relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold tracking-wider py-3 px-8 transition-all duration-300",
                "hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isAnimating && "animate-pulse"
              )}
            >
              {isAnimating ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>CREATING...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Crown className="h-5 w-5" />
                  <span>CREATE TEAM</span>
                  <Zap className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}