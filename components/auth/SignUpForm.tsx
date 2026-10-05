"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useFundly } from "@/lib/store";
import {
  hasErrors,
  validateSignUp,
  type SignUpValues,
  type ValidationErrors,
} from "@/lib/validations";
import { Button, Input } from "@/components/ui";
import { AuthLayout, FormAlert } from "@/components/auth/AuthLayout";

const EMPTY: SignUpValues = { name: "", identifier: "", password: "" };

export function SignUpForm() {
  const router = useRouter();
  const { signUp } = useFundly();

  const [values, setValues] = useState<SignUpValues>(EMPTY);
  const [errors, setErrors] = useState<ValidationErrors<keyof SignUpValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: keyof SignUpValues) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Clear the field's error as soon as the user starts correcting it.
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found = validateSignUp(values);
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await signUp(values.name.trim(), values.identifier.trim());
      router.replace("/dashboard");
    } catch {
      setFormError("We couldn't create your account. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking household funds in a couple of minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-800"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FormAlert message={formError} />

        <div className="flex flex-col gap-4">
          <Input
            label="Full name"
            value={values.name}
            onChange={(event) => set("name")(event.target.value)}
            error={errors.name}
            autoComplete="name"
            placeholder="Alex Johnson"
            required
            data-autofocus
          />

          <Input
            label="Email or phone number"
            value={values.identifier}
            onChange={(event) => set("identifier")(event.target.value)}
            error={errors.identifier}
            hint="Use whichever you remember. You can add the other later."
            leadingIcon={<Mail className="size-4" />}
            autoComplete="email"
            inputMode="email"
            placeholder="alex@example.com"
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(event) => set("password")(event.target.value)}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number."
            leadingIcon={<Lock className="size-4" />}
            autoComplete="new-password"
            placeholder="••••••••"
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-cream-200 hover:text-ink-800"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            }
          />
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          loadingText="Creating your account…"
          className="mt-6"
        >
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}