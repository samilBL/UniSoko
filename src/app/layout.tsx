import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import StudentOnboardingHost from "@/components/StudentOnboardingHost";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import SplashScreen from "@/components/SplashScreen";
import { SITE_URL } from '@/lib/seo';
import { UNISOKO_CONTACT } from '@/lib/siteConfig';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'UniSoko',
  title: {
    default: 'UniSoko | Tanzania Campus Marketplace',
    template: '%s | UniSoko',
  },
  description:
    'Shop laptops, smartphones, and student essentials directly from UniSoko, with wholesale pricing and campus-aware delivery across Tanzania.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'UniSoko',
    locale: 'en_TZ',
    url: '/',
    title: 'UniSoko | Tanzania Campus Marketplace',
    description: 'Shop student essentials directly from UniSoko, with wholesale pricing and campus-aware delivery across Tanzania.',
  },
  twitter: {
    card: 'summary',
    title: 'UniSoko | Tanzania Campus Marketplace',
    description: 'Shop student essentials directly from UniSoko across Tanzania.',
  },
  icons: {
    icon: "/icons/unisoko-logo.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UniSoko",
  },
  creator: UNISOKO_CONTACT.developerName,
  authors: [{ name: UNISOKO_CONTACT.developerName, url: UNISOKO_CONTACT.emailUrl }],
  other: {
    "contact:phone": UNISOKO_CONTACT.phoneE164,
    "contact:whatsapp": UNISOKO_CONTACT.phoneE164,
    "contact:email": UNISOKO_CONTACT.email,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        <StoreProvider>
          <SplashScreen />
          {children}
          <StudentOnboardingHost />
          <PwaInstallPrompt />
        </StoreProvider>
      </body>
    </html>
  );
}
