import type { Metadata } from "next";
import { AddMoneyForm } from "@/components/funds/AddMoneyForm";

export const metadata: Metadata = {
  title: "Add money",
  description: "Record money received for a fund.",
};

export default async function AddMoneyPage({
  params,
}: {
  params: Promise<{ fundId: string }>;
}) {
  const { fundId } = await params;
  return <AddMoneyForm fundId={fundId} />;
}