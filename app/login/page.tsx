import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Fundly household account.",
};

export default function LoginPage() {
  return <LoginForm />;
}