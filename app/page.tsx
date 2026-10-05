import type { Metadata } from "next";
import { HomeLanding } from "@/components/landing/HomeLanding";

export const metadata: Metadata = {
  title: "Fundly — Household spending made clear",
  description:
    "Track money given to funds, record every naira spent, and share a clear summary with your household. Built for Nigerian families.",
};

export default function HomePage() {
  return <HomeLanding />;
}