import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sarbat — Find a time everyone can make",
  description: "A minimalist availability poll for scheduling meetings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAFA] text-[#111827] antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="px-6 py-4 flex items-center">
            <a
              href="/"
              className="text-sm font-semibold tracking-tight text-[#1F3057]"
            >
              sarbat
            </a>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="px-6 py-6 text-center text-xs text-[#6B7280]">
            Built for Sarbat — A Sikh Conference
          </footer>
        </div>
      </body>
    </html>
  );
}
