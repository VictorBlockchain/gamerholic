"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { MobileNavigation } from "@/components/mobile/mobile-navigation"
import { MobileFooter } from "@/components/mobile/mobile-footer"
import { PageBackground } from "@/components/layout/page-background"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Lock,
  Globe,
  Clock,
  AlertCircle,
  Check,
  Brain,
  Trophy,
  Wallet,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

// Agreement sections
const AGREEMENT_SECTIONS = [
  {
    id: "intro",
    title: "Introduction",
    content:
      "Welcome to Gamerholic. These Terms of Service ('Terms') govern your access to and use of the Gamerholic platform, including our website, mobile applications, and all related services (collectively, the 'Service'). By accessing or using the Service, you agree to be bound by these Terms.",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: "eligibility",
    title: "Eligibility",
    content:
      "You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you are 18 years of age or older and have the legal capacity to enter into these Terms.",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: "account",
    title: "Account Registration",
    content:
      "To access certain features of the Service, you may need to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.",
    icon: <Lock className="w-4 h-4" />,
  },
  {
    id: "content",
    title: "User Content",
    content:
      "The Service allows you to create, upload, and share content, including games, game assets, and other materials ('User Content'). You retain all rights in your User Content, but you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display your User Content in connection with the Service. You represent and warrant that you own or have the necessary rights to your User Content and that your User Content does not violate the rights of any third party or any applicable law or regulation.",
    icon: <Globe className="w-4 h-4" />,
  },
  {
    id: "ai",
    title: "AI-Generated Content",
    content:
      "The Service includes AI tools that can generate content based on your inputs. You are responsible for the inputs you provide to our AI tools and for reviewing and approving any AI-generated content before publishing or sharing it. You retain ownership of the AI-generated content created through your use of the Service, subject to our underlying intellectual property rights in the AI technology and any third-party rights in the training data.",
    icon: <Brain className="w-4 h-4" />,
  },
  {
    id: "tournaments",
    title: "Tournaments and Competitions",
    content:
      "The Service allows you to participate in tournaments and competitions. By participating in a tournament or competition, you agree to abide by the specific rules and terms for that event. Prize distributions are subject to verification of eligibility and compliance with these Terms and any applicable tournament rules. All decisions regarding prize distributions are final.",
    icon: <Trophy className="w-4 h-4" />,
  },
  {
    id: "crypto",
    title: "Cryptocurrency and Blockchain",
    content:
      "The Service integrates with the Solana blockchain and uses cryptocurrency for certain transactions. You are responsible for understanding the risks associated with blockchain technology and cryptocurrency, including volatility, regulatory uncertainty, and technical vulnerabilities. We are not responsible for any losses you may incur as a result of your cryptocurrency transactions or wallet management.",
    icon: <Wallet className="w-4 h-4" />,
  },
  {
    id: "prohibited",
    title: "Prohibited Conduct",
    content:
      "You agree not to: Use the Service for any illegal purpose or in violation of any applicable law or regulation; Violate or infringe other people's intellectual property, privacy, or other rights; Use the Service to transmit any malware, spyware, or other harmful code; Interfere with or disrupt the Service or servers or networks connected to the Service; Attempt to gain unauthorized access to any portion of the Service; Use the Service to collect or harvest any personally identifiable information; Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity; Use the Service for any fraudulent or deceptive purpose.",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  {
    id: "termination",
    title: "Termination",
    content:
      "We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.",
    icon: <Clock className="w-4 h-4" />,
  },
]

export function AgreementMobile() {
    const router = useRouter()
    const isMobile = useMobile()
    const [scrolled, setScrolled] = useState(false)
    const [expandedSection, setExpandedSection] = useState<string | null>(null)
    const [readProgress, setReadProgress] = useState(0)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)
  
    // Handle scroll for header styling and reading progress
    useEffect(() => {
      const handleScroll = () => {
        setScrolled(window.scrollY > 10)
  
        if (contentRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = document.documentElement
          const windowHeight = scrollHeight - clientHeight
          const progress = (scrollTop / windowHeight) * 100
          setReadProgress(Math.min(progress, 100))
        }
      }
  
      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }, [])
  
    const toggleSection = (section: string) => {
      if (expandedSection === section) {
        setExpandedSection(null)
      } else {
        setExpandedSection(section)
      }
    }
    return(
        <>
        {/* Reading Progress */}
      <div className="fixed top-16 left-0 right-0 z-40">
        <Progress value={readProgress} className="h-1 bg-[#222]" indicatorClassName="bg-[#00FFA9]" />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-4 relative z-10" ref={contentRef}>
        <ScrollReveal>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
            <p className="text-gray-400 text-sm">Last updated: March 12, 2025</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#00FFA9]/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#00FFA9]" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Terms Summary</h2>
                  <p className="text-xs text-gray-400">Key points of our agreement</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#00FFA9] mt-0.5" />
                  <p>You must be 18+ to use Gamerholic</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#00FFA9] mt-0.5" />
                  <p>You own your content, but grant us license to use it</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#00FFA9] mt-0.5" />
                  <p>AI-generated content is yours, subject to our tech rights</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#00FFA9] mt-0.5" />
                  <p>Cryptocurrency transactions carry inherent risks</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#00FFA9] mt-0.5" />
                  <p>We can terminate access if terms are violated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Agreement Sections */}
        <div className="space-y-4 mb-8">
          {AGREEMENT_SECTIONS.map((section, index) => (
            <ScrollReveal key={section.id} delay={100 + index * 50}>
              <Card
                className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl overflow-hidden"
                onClick={() => toggleSection(section.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center">
                        {section.icon}
                      </div>
                      <h3 className="text-base font-medium">{section.title}</h3>
                    </div>
                    {expandedSection === section.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {expandedSection === section.id && (
                    <div className="mt-4 pt-4 border-t border-[#222] text-sm text-gray-300">{section.content}</div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {/* Accept Terms */}
        <ScrollReveal>
          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="relative mt-0.5">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="border-[#00FFA9] data-[state=checked]:bg-[#00FFA9] data-[state=checked]:text-black"
                  />
                </div>
                <label htmlFor="accept-terms" className="text-sm">
                  I have read and agree to the Terms of Service and Privacy Policy
                </label>
              </div>

              <ButtonPressEffect>
                <Button
                  className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full"
                  disabled={!acceptedTerms}
                >
                  Accept Terms
                </Button>
              </ButtonPressEffect>
            </CardContent>
          </Card>
        </ScrollReveal>
        
        <ScrollReveal delay={100}>
          <div className="text-center text-xs text-gray-500 mb-8">
            <p>If you have any questions about these Terms, please contact us at:</p>
            <p className="text-[#00FFA9]">legal@gamerholic.xyz</p>
          </div>
        </ScrollReveal>
      </main>

        </>
    )
}