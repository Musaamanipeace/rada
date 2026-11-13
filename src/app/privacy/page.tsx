import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Plain-language privacy policy for Rada. Zero third-party tracking, first-party storage only, and strict data minimization.",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-3">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            Rada is designed from the ground up to respect your privacy. We do
            not track you across the web, we do not sell your data, and we do
            not use third-party analytics or advertising scripts.
          </p>
        </div>

        <section aria-labelledby="hard-limits">
          <h2 id="hard-limits" className="text-2xl font-bold tracking-tight mb-3">
            1. Our Non-Negotiable Hard Limits
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-foreground/90">
            <li>
              <strong>Zero Third-Party Tracking:</strong> We never load Google
              Analytics, Meta pixels, tracking beacons, or device fingerprinting
              scripts.
            </li>
            <li>
              <strong>No Browsing History Snooping:</strong> We never inspect
              your browser history, cache, or external cookies.
            </li>
            <li>
              <strong>First-Party Storage Only:</strong> We only store your
              session, preferences (such as dark mode and thumbnail visibility),
              and guest saves locally or in first-party cookies.
            </li>
            <li>
              <strong>No Silent Location Tracking:</strong> We never infer your
              location from GPS or IP addresses. A region is only used if you
              explicitly type or select one for local content.
            </li>
          </ul>
        </section>

        <section aria-labelledby="what-we-collect">
          <h2 id="what-we-collect" className="text-2xl font-bold tracking-tight mb-3">
            2. What Data We Collect
          </h2>
          <p className="mb-3 text-foreground/90">
            We practice strict data minimization. We only store:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/90">
            <li>
              <strong>Account Information:</strong> Your email address when you
              choose to sign in via magic link, and an optional display name.
            </li>
            <li>
              <strong>Stated Interests:</strong> The categories and
              subcategories you select to tailor your discovery feed.
            </li>
            <li>
              <strong>In-App Actions:</strong> Items you save to My Catalogues,
              dismiss as not interested, or add to your calendar.
            </li>
            <li>
              <strong>Pre-Launch Survey Suggestions:</strong> Any title, URL, or
              note you submit during our pre-launch survey.
            </li>
            <li>
              <strong>Personal Content:</strong> Calendar events and portfolio
              pages you explicitly create.
            </li>
          </ul>
        </section>

        <section aria-labelledby="survey-privacy">
          <h2 id="survey-privacy" className="text-2xl font-bold tracking-tight mb-3">
            3. Pre-Launch Survey Data Policy
          </h2>
          <p className="text-foreground/90 mb-3">
            When you take our pre-launch survey:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/90">
            <li>
              Your suggestions are reviewed by a human moderator before anything
              enters the discovery library.
            </li>
            <li>
              If you complete the survey and choose not to create an account,
              your suggestions are retained anonymously to help build the
              curated library.
            </li>
            <li>
              You can choose &ldquo;Delete my answers&rdquo; at the end of the survey to
              permanently erase your suggestions immediately.
            </li>
          </ul>
        </section>

        <section aria-labelledby="your-rights">
          <h2 id="your-rights" className="text-2xl font-bold tracking-tight mb-3">
            4. Your Data Rights
          </h2>
          <p className="text-foreground/90 mb-3">
            You own your data. At any time, logged-in users can view, export in
            standard JSON format, or permanently delete all their account data,
            interests, and saves.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              ← Back to {t.common.appName}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
