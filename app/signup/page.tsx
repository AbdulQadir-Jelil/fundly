import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create a free Fundly account and start tracking household funds and expenses.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}