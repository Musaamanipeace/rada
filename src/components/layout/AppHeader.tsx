import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { AppNavigation } from "./AppNavigation";
import { isWatchAdsEnabled } from "@/lib/config";
import { t } from "@/lib/i18n";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
          >
            <span className="text-primary">●</span> {t.common.appName}
          </Link>

          <AppNavigation watchAdsEnabled={isWatchAdsEnabled} mobile={false} />
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/auth/signin"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.nav.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
