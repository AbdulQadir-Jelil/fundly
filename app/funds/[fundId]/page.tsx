import type { Metadata } from "next";
import { FundDetail } from "@/components/funds/FundDetail";

export const metadata: Metadata = {
  title: "Fund",
  description: "Track a fund's balance, expenses and money added.",
};

export default async function FundPage({
  params,
}: {
  params: Promise<{ fundId: string }>;
}) {
  const { fundId } = await params;
  return <FundDetail fundId={fundId} />;
}