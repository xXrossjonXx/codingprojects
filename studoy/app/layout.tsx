import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studoy (like duh doy)",
  description: "Study sessions and weekly course goals.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
