import Link from "next/link";
import {
  BookOpen,
  Tv,
  Headphones,
  Gamepad2,
  GraduationCap,
  Hammer,
  Compass,
  Activity,
  Coffee,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import taxonomyData from "@/../data/taxonomy.json";
import { t } from "@/lib/i18n";

const categoryIcons: Record<string, typeof BookOpen> = {
  read: BookOpen,
  watch: Tv,
  listen: Headphones,
  play: Gamepad2,
  learn: GraduationCap,
  make: Hammer,
  "go-out": Compass,
  move: Activity,
  rest: Coffee,
  connect: Users,
};

export default function HomePage() {
  const categories = taxonomyData.categories;

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pt-16 md:pt-24 pb-12 border-b border-border/50">
        <div className="container max-w-5xl text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Pre-Launch Library Curation Underway</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight">
            Discover what to do,{" "}
            <span className="text-primary">online and offline.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Rada is a clean, distraction-free discovery app. Zero feed ads, zero
            trackers, and hand-curated recommendations across 10 life categories.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/survey"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Take the Pre-Launch Survey
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/privacy"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card px-6 py-3.5 text-base font-medium text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Our Privacy Commitment
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Zero third-party cookies
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              100% human-moderated
            </span>
          </div>
        </div>
      </section>

      {/* 2. Three-Step How It Works Section */}
      <section className="container max-w-5xl" aria-labelledby="how-it-works-heading">
        <div className="text-center mb-12">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            How Rada Works
          </h2>
          <p className="mt-3 text-muted-foreground">
            A simpler, calmer way to find interesting content and activities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">State Your Interests</h3>
            <p className="text-sm text-muted-foreground">
              Select subcategories you care about from our 10 canonical categories.
              We never infer interests from your browsing history or tracking cookies.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Discover Without Noise</h3>
            <p className="text-sm text-muted-foreground">
              Scroll an endless feed calibrated to your tastes, with Variety mode to
              explore outside your bubble. No ads in your feed—ever.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Save, Plan & Build</h3>
            <p className="text-sm text-muted-foreground">
              Collect finds in My Catalogues, add dated events to your Calendar,
              and showcase your own creative projects with our Portfolio builder.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Category Preview Across 10 Taxonomy Categories */}
      <section className="container max-w-6xl" aria-labelledby="categories-heading">
        <div className="text-center mb-12">
          <h2
            id="categories-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Curated Across 10 Life Spheres
          </h2>
          <p className="mt-3 text-muted-foreground">
            Strictly categorised. Every item has one category, subcategory, and topic.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] || Compass;
            return (
              <div
                key={category.id}
                className="flex flex-col items-center text-center p-5 rounded-lg border border-border bg-card/60 transition hover:bg-card hover:border-primary/50 hover:shadow-sm"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-primary mb-3">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-base mb-1">{category.name}</h3>
                <span className="text-xs text-muted-foreground">
                  {category.subcategories.length} subcategories
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Example Portfolios Showcase */}
      <section className="container max-w-5xl" aria-labelledby="portfolios-heading">
        <div className="text-center mb-12">
          <h2
            id="portfolios-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Clean, Fast Portfolios
          </h2>
          <p className="mt-3 text-muted-foreground">
            Showcase your best projects and links with lightweight, accessible templates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground mb-3">
                Minimalist Template
              </span>
              <h3 className="text-lg font-bold">alex.rada.app</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Independent product designer & typography enthusiast showcasing 3 curated case studies.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-primary font-medium">
              View template preview →
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground mb-3">
                Editorial Template
              </span>
              <h3 className="text-lg font-bold">elena.rada.app</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Longform essayist and newsletter author highlighting recent deep dives and podcast appearances.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-primary font-medium">
              View template preview →
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground mb-3">
                Craft Template
              </span>
              <h3 className="text-lg font-bold">marcus.rada.app</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Woodworker and industrial builder displaying workshop logs, commissions, and upcoming fairs.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-primary font-medium">
              View template preview →
            </div>
          </div>
        </div>
      </section>

      {/* 5. Advertise With Us Callout */}
      <section className="container max-w-4xl" aria-labelledby="advertise-heading">
        <div className="rounded-xl border border-border bg-secondary/50 p-8 text-center flex flex-col items-center">
          <h2 id="advertise-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-3">
            Advertise with Us
          </h2>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base mb-6">
            Rada offers a voluntary, user-initiated ad destination (Watch Ads).
            Advertisers pay strictly for qualified, voluntary views from viewers
            who choose to watch informative stories and videos.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span>Watch Ads portal opens at public launch.</span>
            <Link href="/privacy" className="text-primary hover:underline">
              Read ad privacy standards →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
