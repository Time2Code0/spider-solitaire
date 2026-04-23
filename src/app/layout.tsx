import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AsciiSignature } from "./layout.client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spider Solitaire",
  description:
    "A modern Spider Solitaire with 1, 2 and 4-suit variants, undo, hints, and card-table styling.",
};

type RootLayoutProps = Readonly<{ children: React.ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html className={geistSans.variable} lang="en">
      <body className="relative font-sans text-base antialiased">
        <div className="isolate flex min-h-screen flex-col">{children}</div>
        <AsciiSignature />
      </body>
    </html>
  );
}
