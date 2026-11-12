import { t } from "@/lib/i18n";

export default function CalendarPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-extrabold tracking-tight mb-4">
        {t.calendar.title}
      </h1>
      <p className="text-muted-foreground">
        {t.calendar.empty}
      </p>
    </div>
  );
}
