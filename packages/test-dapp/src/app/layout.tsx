import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "W3Wallets Test DApp",
  description: "Test DApp for w3wallets library",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get wagmi initial state from cookies for SSR
  const headersList = await headers();
  const cookies = headersList.get("cookie");

  // Import config dynamically to avoid circular deps
  const { config } = await import("@/config/wagmi");
  const initialState = cookieToInitialState(config, cookies);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
