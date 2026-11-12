import React from "react";
import { AppHeader } from "./AppHeader";
import { AppNavigation } from "./AppNavigation";
import { isWatchAdsEnabled } from "@/lib/config";
import { t } from "@/lib/i18n";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground">
      {/* Skip to Content for WCAG 2.2 AA Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {t.common.skipToContent}
      </a>

      <AppHeader />

      <main id="main-content" className="flex-1 pb-20 md:pb-8">
        {children}
      </main>

      <AppNavigation watchAdsEnabled={isWatchAdsEnabled} mobile={true} />

      <footer className="hidden md:block border-t border-border py-6 text-center text-sm text-muted-foreground">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {t.common.appName}. All rights reserved.</p>
          <p className="text-xs">
            Privacy-first discovery. Zero third-party trackers or fingerprinting.
          </p>
        </div>
      </footer>
    </div>
  );
}
