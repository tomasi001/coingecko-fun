import Providers from "@/providers";
import type { Metadata } from "next";
import { Instrument_Sans, Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "Aver AI Token Data",
  description: "Real-time token data for Ethereum and Aver AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${instrumentSans.variable} bg-[#0d0f10] text-[#FFFFFF]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
