import { t } from "@/lib/i18n";

export default function CataloguesPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-extrabold tracking-tight mb-4">
        {t.catalogues.title}
      </h1>
      <p className="text-muted-foreground">
        {t.catalogues.empty}
      </p>
    </div>
  );
}
