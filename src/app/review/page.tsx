import type { Metadata } from "next";
import { ReviewerQueue } from "@/features/survey/ReviewerQueue";

export const metadata: Metadata = {
  title: "Review Queue & Coverage Dashboard",
  description: "Moderation review queue and subcategory coverage tracker for Rada.",
};

export default function ReviewPage() {
  return <ReviewerQueue />;
}
