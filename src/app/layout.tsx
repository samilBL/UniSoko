import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import StudentOnboardingHost from "@/components/StudentOnboardingHost";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniSoko - Premier University Gadget Marketplace & Campus Store (Tanzania)",
  description:
    "Student-first tech marketplace in Tanzania. Certified Grade-A laptops, smartphones, and accessories with Bei ya Jumla wholesale discounts and fast hostel delivery across MUST, TEKU, TIA, Mzumbe, and CUoM.",
  icons: {
    icon: "/icons/unisoko-logo.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UniSoko",
  },
  creator: "Rheis Ifan",
  authors: [{ name: "Rheis Ifan", url: "mailto:qwazerty01012001@gmail.com" }],
  other: {
    "contact:phone": "0704961511",
    "contact:whatsapp": "0704961511",
    "contact:email": "qwazerty01012001@gmail.com",
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
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
        <StoreProvider>
          {children}
          <StudentOnboardingHost />
          <PwaInstallPrompt />
        </StoreProvider>
      </body>
    </html>
  );
}
