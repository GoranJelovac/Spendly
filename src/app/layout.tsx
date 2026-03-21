import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Spendly - Budget Tracker",
    template: "%s | Spendly",
  },
  description:
    "Track your spending, stay on budget. Create budgets, log expenses, and see exactly where your money goes.",
  keywords: ["budget", "tracker", "expenses", "spending", "finance"],
  openGraph: {
    title: "Spendly - Budget Tracker",
    description: "Track your spending, stay on budget.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
