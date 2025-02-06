import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function AgreementPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary neon-glow">User Agreement</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Last Updated: January 30, 2025</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Welcome to Gamerholic. This User Agreement ("Agreement") is a legal agreement between you ("User" or
              "you") and Gamerholic Inc. ("Gamerholic," "we," or "us") governing your use of the Gamerholic platform,
              website, and services (collectively, the "Service").
            </p>
            <p className="mb-4">
              By accessing or using the Service, you agree to be bound by this Agreement. If you do not agree to this
              Agreement, do not access or use the Service.
            </p>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1">
            <AccordionTrigger>1. Acceptance of Terms</AccordionTrigger>
            <AccordionContent>
              <p>
                By using the Service, you affirm that you are at least 18 years old and are fully able and competent to
                enter into the terms, conditions, obligations, affirmations, representations, and warranties set forth
                in this Agreement.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>2. Description of Service</AccordionTrigger>
            <AccordionContent>
              <p>
                Gamerholic provides a blockchain-based gaming platform where users can play, create, and earn
                cryptocurrency rewards. The Service includes, but is not limited to, game playing, game creation,
                cryptocurrency transactions, and community interactions.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>3. Account Registration and Security</AccordionTrigger>
            <AccordionContent>
              <p>
                To access certain features of the Service, you must create an account. You agree to provide accurate,
                current, and complete information during the registration process and to update such information to keep
                it accurate, current, and complete.
              </p>
              <p>
                You are responsible for safeguarding your account credentials and for any activities or actions under
                your account. Notify us immediately of any unauthorized use of your account or any other breach of
                security.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>4. User Conduct</AccordionTrigger>
            <AccordionContent>
              <p>You agree not to engage in any of the following prohibited activities:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Violating any applicable laws or regulations</li>
                <li>Infringing on the intellectual property rights of others</li>
                <li>
                  Attempting to interfere with, compromise the system integrity or security, or decipher any
                  transmissions to or from the servers running the Service
                </li>
                <li>Using the Service for any illegal or unauthorized purpose</li>
                <li>Engaging in any form of cheating or exploiting bugs in the games</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>5. Intellectual Property Rights</AccordionTrigger>
            <AccordionContent>
              <p>
                The Service and its original content, features, and functionality are owned by Gamerholic and are
                protected by international copyright, trademark, patent, trade secret, and other intellectual property
                or proprietary rights laws.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>6. Cryptocurrency Transactions</AccordionTrigger>
            <AccordionContent>
              <p>
                You acknowledge that cryptocurrency transactions are irreversible and you are solely responsible for
                managing your digital wallet and transactions. Gamerholic is not responsible for any loss of
                cryptocurrency due to user error or hacking attempts on your personal wallet.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger>7. Limitation of Liability</AccordionTrigger>
            <AccordionContent>
              <p>
                To the maximum extent permitted by law, Gamerholic shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
                directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from
                your access to or use of or inability to access or use the Service.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger>8. Modifications to the Agreement</AccordionTrigger>
            <AccordionContent>
              <p>
                We reserve the right to modify or replace this Agreement at any time. We will provide notice of any
                material changes by posting the new Agreement on the Service. Your continued use of the Service after
                any such changes constitutes your acceptance of the new Agreement.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9">
            <AccordionTrigger>9. Governing Law</AccordionTrigger>
            <AccordionContent>
              <p>
                This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in
                which Gamerholic is registered, without regard to its conflict of law provisions.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10">
            <AccordionTrigger>10. Contact Information</AccordionTrigger>
            <AccordionContent>
              <p>If you have any questions about this Agreement, please contact us at legal@gamerholic.com.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
    </div>
  )
}

