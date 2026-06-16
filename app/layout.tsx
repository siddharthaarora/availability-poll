import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Availability Poll — Find a time everyone can make",
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
              availability poll
            </a>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="px-6 py-6 text-center text-xs text-[#6B7280]">
            A free, open-source scheduling tool
          </footer>
        </div>
      </body>
    </html>
  );
}
