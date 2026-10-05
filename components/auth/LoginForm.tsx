"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useFundly } from "@/lib/store";
import {
  hasErrors,
  validateLogin,
  type LoginValues,
  type ValidationErrors,
} from "@/lib/validations";
import { Button, Input } from "@/components/ui";
import { AuthLayout, FormAlert } from "@/components/auth/AuthLayout";

export function LoginForm() {
  const router = useRouter();
  const { signIn, data } = useFundly();

  const [values, setValues] = useState<LoginValues>({
    identifier: data.user?.email ?? "",
    password: "",
  });
  const [errors, setErrors] = useState<ValidationErrors<keyof LoginValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: keyof LoginValues) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found = validateLogin(values);
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await signIn(values.identifier.trim());
      router.replace("/dashboard");
    } catch {
      setFormError("We couldn't log you in. Check your details and try again.");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up where your household left off."
      footer={
        <>
          New to Fundly?{" "}
          <Link
            href="/signup"
            className="font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-800"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FormAlert message={formError} />

        <div className="flex flex-col gap-4">
          <Input
            label="Email or phone number"
            value={values.identifier}
            onChange={(event) => set("identifier")(event.target.value)}
            error={errors.identifier}
            leadingIcon={<Mail className="size-4" />}
            autoComplete="username"
            inputMode="email"
            placeholder="alex@example.com"
            required
            data-autofocus
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(event) => set("password")(event.target.value)}
            error={errors.password}
            leadingIcon={<Lock className="size-4" />}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
          loadingText="Logging you in…"
          className="mt-6"
        >
          Log in
        </Button>

        <p className="mt-4 text-center text-[13px] leading-relaxed text-ink-500">
          This prototype keeps everything on your device — any email or phone
          number and any password will get you in.
        </p>
      </form>
    </AuthLayout>
  );
}