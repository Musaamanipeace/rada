import type { Metadata } from "next";
import { SurveyFlow } from "@/features/survey/SurveyFlow";

export const metadata: Metadata = {
  title: "Pre-Launch Contributor Survey",
  description:
    "Help curate the Rada discovery library across 10 life spheres. Submit your favorite articles, tools, videos, and books.",
};

export default function SurveyPage() {
  return <SurveyFlow />;
}
