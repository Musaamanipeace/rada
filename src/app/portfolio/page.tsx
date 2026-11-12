import { t } from "@/lib/i18n";

export default function PortfolioPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-extrabold tracking-tight mb-4">
        {t.portfolio.title}
      </h1>
      <p className="text-muted-foreground">
        Build and showcase your curated highlights and projects.
      </p>
    </div>
  );
}
