import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsScreen } from "@/components/reports/ReportsScreen";

export const metadata: Metadata = {
  title: "Reports",
  description: "Review spending and share a clear summary with your household.",
};

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsScreen />
    </Suspense>
  );
}