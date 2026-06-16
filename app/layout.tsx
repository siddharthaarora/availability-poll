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
          <header className="px-6 py-4 border-b border-gray-200/70 flex items-center">
            <a href="/" className="group inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F3057] text-white shadow-sm transition-transform group-hover:scale-105">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" strokeLinecap="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                </svg>
              </span>
              <span className="text-2xl font-bold leading-none tracking-tight text-[#1F3057]">
                availability<span className="text-[#9CA3AF]"> poll</span>
              </span>
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
