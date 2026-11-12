"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Bookmark, Calendar, User, Eye } from "lucide-react";
import { t } from "@/lib/i18n";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Compass;
  show: boolean;
}

interface AppNavigationProps {
  watchAdsEnabled?: boolean;
  mobile?: boolean;
}

export function AppNavigation({
  watchAdsEnabled = false,
  mobile = false,
}: AppNavigationProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: "/",
      label: t.nav.feed,
      icon: Compass,
      show: true,
    },
    {
      href: "/catalogues",
      label: t.nav.catalogues,
      icon: Bookmark,
      show: true,
    },
    {
      href: "/calendar",
      label: t.nav.calendar,
      icon: Calendar,
      show: true,
    },
    {
      href: "/portfolio",
      label: t.nav.portfolio,
      icon: User,
      show: true,
    },
    {
      href: "/watch-ads",
      label: t.nav.watchAds,
      icon: Eye,
      show: watchAdsEnabled, // D23: Hidden when switch is off
    },
  ].filter((item) => item.show);

  if (mobile) {
    return (
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-card/95 px-2 backdrop-blur md:hidden"
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "bg-secondary text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
