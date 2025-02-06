import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary neon-glow">Privacy Policy</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Last Updated: January 30, 2025</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              At Gamerholic, we are committed to protecting your privacy and ensuring the security of your personal
              information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our Service.
            </p>
            <p className="mb-4">
              By using the Service, you agree to the collection and use of information in accordance with this policy.
              If you do not agree with our policies and practices, do not use our Service.
            </p>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1">
            <AccordionTrigger>1. Information We Collect</AccordionTrigger>
            <AccordionContent>
              <p>We collect several types of information from and about users of our Service, including:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Personal information: Such as your name, email address, and blockchain wallet address.</li>
                <li>
                  Usage data: Information on how you access and use the Service, including game play statistics,
                  transaction history, and interaction with other users.
                </li>
                <li>Device information: Including your IP address, browser type, and operating system.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>2. How We Use Your Information</AccordionTrigger>
            <AccordionContent>
              <p>We use the information we collect about you to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Service</li>
                <li>
                  Detect, prevent, and address technical issues, fraudulent transactions, or other illegal activities
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>3. Disclosure of Your Information</AccordionTrigger>
            <AccordionContent>
              <p>
                We may disclose aggregated information about our users without restriction. We may disclose personal
                information:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To comply with any court order, law, or legal process</li>
                <li>To enforce our rights arising from any contracts entered into between you and us</li>
                <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
                <li>To protect the personal safety of users of the Service or the public</li>
                <li>With your consent or at your direction</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>4. Data Security</AccordionTrigger>
            <AccordionContent>
              <p>
                We have implemented measures designed to secure your personal information from accidental loss and from
                unauthorized access, use, alteration, and disclosure. However, the transmission of information via the
                internet is not completely secure. We cannot guarantee the security of your personal information
                transmitted to our Service.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>5. Blockchain Transactions</AccordionTrigger>
            <AccordionContent>
              <p>
                Please note that blockchain transactions are public, and information about your cryptocurrency
                transactions will be visible on the blockchain. We do not control this information and cannot remove or
                alter blockchain data.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>6. Your Choices About Your Information</AccordionTrigger>
            <AccordionContent>
              <p>
                You can review and change your personal information by logging into the Service and visiting your
                account profile page. You may also send us an email at privacy@gamerholic.com to request access to,
                correct, or delete any personal information that you have provided to us.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger>7. Children's Privacy</AccordionTrigger>
            <AccordionContent>
              <p>
                Our Service is not intended for children under 18 years of age. We do not knowingly collect personal
                information from children under 18. If you are a parent or guardian and you are aware that your child
                has provided us with personal information, please contact us.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger>8. Changes to Our Privacy Policy</AccordionTrigger>
            <AccordionContent>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9">
            <AccordionTrigger>9. Contact Information</AccordionTrigger>
            <AccordionContent>
              <p>
                To ask questions or comment about this Privacy Policy and our privacy practices, contact us at:
                privacy@gamerholic.com
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
    </div>
  )
}

