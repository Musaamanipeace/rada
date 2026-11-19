import { CataloguesView } from "@/features/catalogues/CataloguesView";

export const metadata = {
  title: "My Catalogues — Rada",
  description: "Your saved suggestions, courses, books, media, and experiences organized into shelves.",
};

export default function CataloguesPage() {
  return <CataloguesView />;
}
