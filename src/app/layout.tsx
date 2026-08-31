import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentUser } from "@/lib/session";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700", "800"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travel Grid India — Stay & Host Marketplace",
  description:
    "Book independent stays, or list your own property. A two-sided marketplace for travellers and hosts.",
  icons: {
    icon: "/lg.jpeg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh font-sans">
        <Navbar
          user={
            user
              ? { name: user.name, role: user.role as "BUYER" | "SELLER" | "ADMIN" }
              : null
          }
        />
        <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
