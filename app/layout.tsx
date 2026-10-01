import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/react-patch";
import AppShell from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://quantsynthica.com"),
  title: "QuantSynthicaLab — Quantitative Intelligence for Modern Markets",
  description: "Institutional research lab for charts, algorithmic strategies, and backtests across US and India markets.",
  icons: {
    icon: [
      { url: "/branding/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/branding/quantsynthicalab-mark.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/branding/favicon.svg"],
  },
  openGraph: {
    title: "QuantSynthicaLab",
    description: "Quantitative Intelligence for Modern Markets. Research • Strategy • Risk • Portfolio",
    images: [{ url: "/branding/quantsynthicalab-logo.png", width: 1024, height: 682, alt: "QuantSynthicaLab" }],
  },
};

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('qs_theme');
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="qs-app min-h-screen bg-background font-sans text-[#d1d4dc] antialiased selection:bg-[#2962FF]/40 selection:text-white">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
