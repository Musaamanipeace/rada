import { t } from "@/lib/i18n";

export default function HomePage() {
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {t.feed.title}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t.common.tagline}
        </p>
      </div>
    </div>
  );
}
