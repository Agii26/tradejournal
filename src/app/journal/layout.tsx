import { auth, signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { JournalHeader } from "@/components/journal-header";

export default async function JournalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
      <JournalHeader
        userEmail={session?.user?.email}
        rightSlot={
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="text-sm text-muted hover:text-ink cursor-pointer">
                Sign out
              </button>
            </form>
          </div>
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
