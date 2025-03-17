"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageBackground } from "@/components/layout/page-background"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, ChevronRight, Code, Gamepad2, Globe, HeartHandshake, Layers, Trophy, Users, Zap } from "lucide-react"

export function AgreementDesktop() {
    
    return(
        <>
         <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-400">Last updated: March 12, 2025</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <p>
              Welcome to Gamerholic. These Terms of Service ("Terms") govern your access to and use of the Gamerholic
              platform, including our website, mobile applications, and all related services (collectively, the
              "Service"). By accessing or using the Service, you agree to be bound by these Terms.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do
              not agree to these Terms, you may not access or use the Service.
            </p>

            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that
              you are 18 years of age or older and have the legal capacity to enter into these Terms.
            </p>

            <h2>3. Account Registration</h2>
            <p>
              To access certain features of the Service, you may need to register for an account. You agree to provide
              accurate, current, and complete information during the registration process and to update such information
              to keep it accurate, current, and complete.
            </p>
            <p>
              You are responsible for safeguarding your account credentials and for all activities that occur under your
              account. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h2>4. User Content</h2>
            <p>
              The Service allows you to create, upload, and share content, including games, game assets, and other
              materials ("User Content"). You retain all rights in your User Content, but you grant us a worldwide,
              non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, create
              derivative works from, distribute, and display your User Content in connection with the Service.
            </p>
            <p>
              You represent and warrant that you own or have the necessary rights to your User Content and that your
              User Content does not violate the rights of any third party or any applicable law or regulation.
            </p>

            <h2>5. AI-Generated Content</h2>
            <p>
              The Service includes AI tools that can generate content based on your inputs. You are responsible for the
              inputs you provide to our AI tools and for reviewing and approving any AI-generated content before
              publishing or sharing it.
            </p>
            <p>
              You retain ownership of the AI-generated content created through your use of the Service, subject to our
              underlying intellectual property rights in the AI technology and any third-party rights in the training
              data.
            </p>

            <h2>6. Tournaments and Competitions</h2>
            <p>
              The Service allows you to participate in tournaments and competitions. By participating in a tournament or
              competition, you agree to abide by the specific rules and terms for that event.
            </p>
            <p>
              Prize distributions are subject to verification of eligibility and compliance with these Terms and any
              applicable tournament rules. All decisions regarding prize distributions are final.
            </p>

            <h2>7. Cryptocurrency and Blockchain</h2>
            <p>
              The Service integrates with the Solana blockchain and uses cryptocurrency for certain transactions. You
              are responsible for understanding the risks associated with blockchain technology and cryptocurrency,
              including volatility, regulatory uncertainty, and technical vulnerabilities.
            </p>
            <p>
              We are not responsible for any losses you may incur as a result of your cryptocurrency transactions or
              wallet management.
            </p>

            <h2>8. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of any applicable law or regulation</li>
              <li>Violate or infringe other people's intellectual property, privacy, or other rights</li>
              <li>Use the Service to transmit any malware, spyware, or other harmful code</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Use the Service to collect or harvest any personally identifiable information</li>
              <li>
                Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a
                person or entity
              </li>
              <li>Use the Service for any fraudulent or deceptive purpose</li>
            </ul>

            <h2>9. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for
              any reason, including if you breach these Terms.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. All provisions of these Terms
              which by their nature should survive termination shall survive termination, including, without limitation,
              ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p>
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR
              THAT THE SERVICE OR THE SERVERS THAT MAKE IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>

            <h2>11. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING
              FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
            </p>

            <h2>12. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Gamerholic and its officers, directors, employees, and
              agents, from and against any claims, liabilities, damages, losses, and expenses, including, without
              limitation, reasonable legal and accounting fees, arising out of or in any way connected with your access
              to or use of the Service or your violation of these Terms.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
              without regard to its conflict of law provisions.
            </p>

            <h2>14. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision
              is material, we will provide at least 30 days' notice prior to any new terms taking effect. What
              constitutes a material change will be determined at our sole discretion.
            </p>

            <h2>15. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at legal@gamerholic.xyz.</p>
          </div>

          <div className="mt-12 flex justify-center">
            <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full px-8 py-6 h-auto">
              I Accept the Terms
            </Button>
          </div>
        </div>
      </div>
        </>
    )
}