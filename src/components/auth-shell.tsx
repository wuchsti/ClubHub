import { Logo } from "@/components/logo";

/** Shared page shell for auth-ish screens (login, signup, onboarding, …):
 * a colorful background plus a logo that links back to the homepage. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 via-white to-white dark:from-indigo-950/30 dark:via-background dark:to-background">
      <div className="px-6 py-6">
        <Logo />
      </div>
      <div className="flex flex-1 items-center justify-center p-6 pb-16">{children}</div>
    </main>
  );
}
