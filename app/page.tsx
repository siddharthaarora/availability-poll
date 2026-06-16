import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-32">
      <h1 className="text-3xl font-semibold tracking-tight text-[#111827] mb-3">
        Find a time everyone can make.
      </h1>
      <p className="text-[#6B7280] mb-8 text-center max-w-md">
        Create an availability poll, share the link, and see when your group is
        free — no signup required.
      </p>
      <Link
        href="/new"
        className="inline-flex items-center gap-2 rounded-lg bg-[#111827] px-6 py-3 text-sm font-medium text-white hover:bg-[#1F3057] transition-colors"
      >
        Create a new poll
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
