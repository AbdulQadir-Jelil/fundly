import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateFundForm } from "@/components/funds/CreateFundForm";

export const metadata: Metadata = {
  title: "New fund",
  description: "Create a new fund and record the money it started with.",
};

export default function NewFundPage() {
  return (
    <Suspense fallback={null}>
      <CreateFundForm />
    </Suspense>
  );
}