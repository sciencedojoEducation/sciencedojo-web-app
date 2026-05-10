import type { Metadata } from "next";
import Link from "next/link";
import SupportInfoPage from "@/components/SupportInfoPage";
import { siteUrl } from "@/lib/seo";

const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+94773850821").replace(/[^\d]/g, "");
const whatsappHref = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi ScienceDojo, I need help with online tutoring support.")}`
  : undefined;

export const metadata: Metadata = {
  title: "Contact Us | ScienceDojo",
  description: "Contact ScienceDojo for parent tutor enquiries, student questions, tutor applications, and technical support.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
};

const sections = [
  {
    title: "Contact details",
    items: [
      <><span className="font-bold text-secondary">Email:</span> <a href="mailto:hello@sciencedojo.co.uk" className="font-bold text-primary underline-offset-4 hover:underline">hello@sciencedojo.co.uk</a></>,
      whatsappHref ? <><span className="font-bold text-secondary">WhatsApp:</span> <a href={whatsappHref} target="_blank" rel="noreferrer" className="font-bold text-primary underline-offset-4 hover:underline">Message ScienceDojo on WhatsApp</a></> : "WhatsApp: available through the ScienceDojo website",
      "Response promise: We reply within 2 hours",
    ],
  },
  {
    title: "Contact reasons",
    items: [
      "I'm a parent looking for a tutor",
      "I'm a student with a question",
      "I want to become a tutor",
      "I have a technical issue",
    ],
  },
  {
    title: "Frequently asked questions",
    body: <>You can also return to the <Link href="/#faq" className="font-bold text-primary underline-offset-4 hover:underline">homepage FAQ section</Link> for common online tutoring questions.</>,
  },
];

export default function ContactPage() {
  return (
    <SupportInfoPage
      eyebrow="Contact"
      title="Contact Us"
      subtitle="Get help with tutoring, student support, tutor applications, or technical questions."
      sections={sections}
    />
  );
}
