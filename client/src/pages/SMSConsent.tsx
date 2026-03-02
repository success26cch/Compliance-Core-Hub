import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  Shield,
  Phone,
  Bell,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import logoUrl from "@assets/1_1770683748423.png";

export default function SMSConsent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/">
            <button className="text-gray-400 hover:text-white transition" data-testid="link-back-home">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <img src={logoUrl} alt="CCHUB Logo" className="w-10 h-10 rounded" data-testid="img-logo" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Core Compliance Hub</h1>
            <p className="text-sm text-gray-400">SMS Messaging Consent & Terms</p>
          </div>
        </div>

        <div className="border-b border-gray-700 my-6" />

        <Card className="bg-gray-800/60 border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-white mb-2" data-testid="text-consent-heading">SMS Messaging Consent</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Core Compliance Hub ("CCHUB") and its divisions, including ACSI ISO Manager and BrandNSwag, 
                offer SMS text messaging services to support occupational health compliance, employee safety, 
                and clinic coordination. By providing your phone number and opting in to receive text messages 
                from CCHUB, you agree to the terms outlined below.
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Bell className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-white" data-testid="text-types-heading">Types of Messages You May Receive</h2>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            When you opt in, you consent to receive the following types of SMS messages from CCHUB:
          </p>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span><strong className="text-white">Digital Medical Passport Notifications</strong> — SMS links containing your secure clinic check-in passport (QR code and authorization form link) sent to employees for clinic visits.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span><strong className="text-white">Clinic Check-In Alerts ("I'm Here")</strong> — Notifications sent to the Designated Employer Representative (DER) when an employee arrives at a clinic for a scheduled visit.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span><strong className="text-white">Return Notifications ("I'm Back")</strong> — Notifications sent to the DER when an employee returns from a clinic visit, including total time-away duration.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span><strong className="text-white">DOT Physical Expiration Reminders</strong> — Reminders sent to employees when their DOT physical certification is approaching expiration, helping maintain compliance.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span><strong className="text-white">Compliance Alerts</strong> — Time-sensitive notifications related to regulatory deadlines, required medical surveillance, or safety compliance actions.</span>
            </li>
          </ul>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Phone className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-white" data-testid="text-how-heading">How You Opt In</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            You provide consent to receive SMS messages from CCHUB through one or more of the following actions:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">1.</span>
              <span>Providing your phone number in the <strong className="text-white">Company Profile settings</strong> as the Designated Employer Representative (DER) contact number for receiving clinic visit notifications.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Entering an employee's phone number in the <strong className="text-white">Employee Management system</strong> and using the "Text Passport" feature to send a Digital Medical Passport link to the employee.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Enabling <strong className="text-white">DOT Physical SMS notifications</strong> for employees with upcoming certification expirations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">4.</span>
              <span>Using any feature within the CCHUB platform that includes a <strong className="text-white">"Send SMS"</strong> or <strong className="text-white">"Text"</strong> action, which constitutes opt-in consent for that specific message.</span>
            </li>
          </ul>
          <p className="text-gray-400 text-xs mt-4">
            By entering a phone number and initiating an SMS action, the user confirms they have obtained proper consent from the recipient to receive the message.
          </p>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-white" data-testid="text-terms-heading">Messaging Terms</h2>
          </div>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span><strong className="text-white">Message Frequency:</strong> Message frequency varies based on your usage of the platform. Messages are only sent when triggered by specific actions (e.g., generating a passport, clinic check-in, DOT reminders). You will not receive marketing or promotional texts.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span><strong className="text-white">Message & Data Rates:</strong> Message and data rates may apply depending on your mobile carrier and plan. CCHUB is not responsible for any charges incurred from your carrier.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span><strong className="text-white">No Marketing Messages:</strong> CCHUB does not send marketing, advertising, or promotional SMS messages. All messages are transactional and related to occupational health compliance activities.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span><strong className="text-white">Carrier Disclaimer:</strong> Carriers are not liable for delayed or undelivered messages.</span>
            </li>
          </ul>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-white" data-testid="text-optout-heading">How to Opt Out</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            You can opt out of receiving SMS messages at any time using any of the following methods:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong className="text-white">Reply STOP</strong> to any message received from CCHUB. You will receive a confirmation that you have been unsubscribed.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong className="text-white">Remove your phone number</strong> from the Company Profile settings or Employee Management page within the CCHUB platform.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong className="text-white">Contact us</strong> at <a href="mailto:support@corecompliance.hub" className="text-blue-400 underline">support@corecompliance.hub</a> and request to be removed from SMS messaging.</span>
            </li>
          </ul>
          <p className="text-gray-400 text-xs mt-4">
            After opting out, you will no longer receive SMS messages from CCHUB. You may opt back in at any time by re-entering your phone number and initiating an SMS action within the platform.
          </p>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-white" data-testid="text-help-heading">Help & Support</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            For questions or assistance regarding SMS messaging:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong className="text-white">Reply HELP</strong> to any message to receive support information.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong className="text-white">Email:</strong> <a href="mailto:support@corecompliance.hub" className="text-blue-400 underline">support@corecompliance.hub</a></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong className="text-white">Website:</strong> <Link href="/contact"><span className="text-blue-400 underline cursor-pointer">Contact Us</span></Link></span>
            </li>
          </ul>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-gray-400 mt-1 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-white" data-testid="text-privacy-heading">Privacy & Data Use</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            CCHUB values your privacy. Phone numbers provided for SMS messaging are used solely for the purposes described above. 
            We do not sell, share, or distribute phone numbers to third parties for marketing purposes. 
            Phone numbers are stored securely within the CCHUB platform and are only used to deliver 
            transactional messages related to occupational health compliance, clinic coordination, and employee safety.
            For more information, refer to our Privacy Policy.
          </p>
        </Card>

        <div className="text-center text-gray-500 text-xs mt-8 space-y-1">
          <p>Core Compliance Hub (CCHUB) — Occupational Health & Safety Compliance Platform</p>
          <p>Last Updated: February 2026</p>
          <p className="mt-4">
            <Link href="/">
              <span className="text-blue-400 underline cursor-pointer" data-testid="link-home">Return to Homepage</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
