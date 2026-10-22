import Link from "next/link";
import { cn } from "@/lib/utils";

/** The ClubHub mark: three connected members forming a "hub", in the brand gradient. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("size-7 shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="clubhub-mark-gradient" x1="0" y1="0" x2="28" y2="28">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="8" fill="url(#clubhub-mark-gradient)" />
      <path
        d="M9.5 14a5 5 0 1 1 8 4"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="9" cy="9" r="2" fill="white" />
      <circle cx="19.5" cy="14.5" r="2" fill="white" />
      <circle cx="12.5" cy="19.5" r="2" fill="white" />
    </svg>
  );
}

/** Full wordmark (icon + "ClubHub" text), linking to the homepage. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">
        Club<span className="text-violet-600 dark:text-violet-400">Hub</span>
      </span>
    </Link>
  );
}
