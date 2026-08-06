import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "@/styles.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nexus Analytics — Customer Intelligence",
    template: "%s — Nexus Analytics",
  },
  description:
    "Enterprise customer analytics: revenue, segmentation, sales, marketing and reports in one dense, precise workspace.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Nexus Analytics — Customer Intelligence",
    description: "Enterprise customer analytics workspace.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      dynamic
      appearance={{
        variables: {
          colorPrimary: "oklch(0.6 0.11 189)",
          colorBackground: "oklch(0.985 0 0)",
          colorText: "oklch(0.129 0.042 264.695)",
          borderRadius: "0.625rem",
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
        },
        elements: {
          card: "shadow-sm border border-zinc-200",
        },
      }}
    >
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <body>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
