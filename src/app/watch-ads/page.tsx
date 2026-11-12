import { notFound } from "next/navigation";
import { isWatchAdsEnabled } from "@/lib/config";

export default function WatchAdsPage() {
  // D23: With switch off, return 404 and load zero ad code/media
  if (!isWatchAdsEnabled) {
    notFound();
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold">Watch Ads</h1>
    </div>
  );
}
