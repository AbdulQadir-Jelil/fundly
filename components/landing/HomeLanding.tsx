import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  HandCoins,
  History,
  PiggyBank,
  Receipt,
  Share2,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  WifiOff,
} from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { ButtonLink } from "@/components/ui";
import { BrandMark } from "@/components/navigation/Nav";

/* -------------------------------------------------------------------------- */
/*  Static content                                                            */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    icon: Wallet,
    title: "Create a fund for anything",
    body: "School fees, house groceries, repairs. Record what the money is for and how much was given.",
  },
  {
    icon: Receipt,
    title: "Log every naira spent",
    body: "One tap to add an expense with a category, an amount and a date. No spreadsheets.",
  },
  {
    icon: BarChart3,
    title: "See what is left",
    body: "Received, spent and remaining update the moment you record something.",
  },
  {
    icon: History,
    title: "Nothing disappears",
    body: "Edits keep their history and removed expenses stay visible, so nobody has to take anyone's word for it.",
  },
  {
    icon: Share2,
    title: "Share a clear summary",
    body: "Send a short, plain report to the family chat — totals, balance and where the money went.",
  },
  {
    icon: Users,
    title: "Keep the household together",
    body: "Add family members so everyone can see the same picture of what the house is tracking.",
  },
];

const STEPS = [
  {
    icon: PiggyBank,
    title: "Start a fund",
    body: "Name it, say what it is for, and record the money it started with.",
  },
  {
    icon: HandCoins,
    title: "Add money when more comes in",
    body: "From you, from someone else, or from the household pot. Every naira is attributed.",
  },
  {
    icon: Receipt,
    title: "Record each expense",
    body: "What it was, how much, and when. The balance updates immediately.",
  },
];

/* A tiny mock of the real balance card, built from the same tokens the
   product uses so the landing page never drifts from the app. */
function BalancePreview() {
  const received = 130000;
  const spent = 62500;
  const remaining = received - spent;
  const percent = Math.round((spent / received) * 100);

  const rows = [
    { label: "Groceries", amount: 27500, width: 44 },
    { label: "School fees", amount: 35000, width: 56 },
  ];

  return (
    <div className="w-full max-w-[340px]">
      <div className="rounded-3xl bg-forest-card p-5 shadow-pop">
        <p className="text-[12px] font-semibold tracking-wide text-forest-200 uppercase">
          Available across 3 funds
        </p>
        <p className="tabular mt-1.5 text-[34px] font-extrabold leading-none text-white">
          {formatNaira(remaining)}
        </p>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-sage-400"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-[12px] text-forest-200">
            {formatNaira(spent)} spent
          </span>
          <span className="text-[12px] text-forest-200">
            of {formatNaira(received)}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-cream-400 bg-white p-3.5 shadow-card">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-3 py-1.5 first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-peach-100 text-peach-700"
            >
              <Receipt className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink-900">
                {row.label}
              </p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-cream-300">
                <div
                  className="h-full rounded-full bg-forest-500"
                  style={{ width: `${row.width}%` }}
                />
              </div>
            </div>
            <span className="tabular shrink-0 text-[14px] font-bold text-ink-800">
              {formatNaira(row.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export function HomeLanding() {
  return (
    <div className="min-h-dvh bg-cream-200">
      <LandingHeader />

      <main id="main">
        {/* ---- Hero ------------------------------------------------- */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-forest-100/50 blur-3xl"
          />

          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-forest-700 shadow-xs">
                <Smartphone className="size-3.5" aria-hidden="true" />
                Built for Nigerian households
              </span>

              <h1 className="mt-5 text-[34px] font-extrabold leading-[1.1] text-ink-900 sm:text-5xl lg:text-[52px]">
                Household spending,
                <br />
                <span className="text-forest-700">made clear.</span>
              </h1>

              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-600 sm:text-[17px]">
                Fundly helps you track money given to a fund, record every
                naira spent from it, and share a clear summary with the people
                you share a home with. No spreadsheets. No arguments.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href="/signup"
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Create your account
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" size="lg">
                  I already have one
                </ButtonLink>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
                {["Free", "Works offline", "No bank connection"].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-1.5 text-[14px] font-medium text-ink-600"
                  >
                    <Check
                      className="size-4 shrink-0 text-sage-600"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Preview card, tilted slightly on desktop for depth. */}
            <div className="flex justify-center lg:justify-end">
              <div className="animate-rise [animation-delay:0.08s] lg:rotate-2 lg:[animation-delay:0.12s]">
                <BalancePreview />
              </div>
            </div>
          </div>
        </section>

        <HowItWorks />
        <Features />
        <TrustStrip />
        <ClosingCta />
      </main>

      <LandingFooter />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-200/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-[17px] font-extrabold text-forest-900">
            Fundly
          </span>
        </Link>

        <nav
          aria-label="Sections"
          className="ml-6 hidden items-center gap-6 md:flex"
        >
          <a
            href="#how"
            className="text-[15px] font-semibold text-ink-600 transition-colors hover:text-forest-700"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-[15px] font-semibold text-ink-600 transition-colors hover:text-forest-700"
          >
            Features
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" variant="primary" size="sm">
            Get started
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  How it works                                                              */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <section
      id="how"
      className="border-t border-cream-300 bg-white py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, then it runs itself"
          body="Fundly is deliberately simple. You do the same three things every time money comes in or goes out."
        />

        <ol className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="relative rounded-2xl border border-cream-300 bg-cream-50 p-6"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-5 top-4 text-[40px] font-extrabold leading-none text-cream-400"
                >
                  {index + 1}
                </span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-forest-700 text-white">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-ink-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Features                                                                  */
/* -------------------------------------------------------------------------- */

function Features() {
  return (
    <section id="features" className="py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything a household needs, nothing it doesn't"
          body="Built around one idea: everyone should be able to see where the money went."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-cream-300 bg-white p-6 transition-shadow hover:shadow-lifted"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[16px] font-bold text-ink-900">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">
                  {feature.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Trust strip                                                               */
/* -------------------------------------------------------------------------- */

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your data stays on your device. Fundly never asks for a bank connection.",
  },
  {
    icon: WifiOff,
    title: "Works without data",
    body: "Once installed, Fundly opens and keeps working even when the network doesn't.",
  },
  {
    icon: Share2,
    title: "Share in one tap",
    body: "Send the summary straight to WhatsApp or copy it to your clipboard.",
  },
];

function TrustStrip() {
  return (
    <section className="border-t border-cream-300 bg-white py-14">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        {TRUST.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-ink-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
                  {item.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Closing CTA + footer                                                      */
/* -------------------------------------------------------------------------- */

function ClosingCta() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-forest-card px-6 py-12 text-center shadow-pop sm:px-12">
        <h2 className="text-[26px] font-extrabold text-white sm:text-3xl">
          Start with one fund today
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-forest-100">
          Set up your first fund in under a minute. Invite the people you share
          a home with when you're ready.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" variant="secondary" size="lg">
            Create your account
          </ButtonLink>
          <ButtonLink
            href="/login"
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/15"
          >
            Log in
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-cream-300 bg-cream-100 py-9">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 sm:px-6 md:flex-row lg:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" />
          <span className="text-[15px] font-bold text-forest-900">Fundly</span>
        </div>
        <p className="text-[13px] text-ink-500 md:ml-auto">
          Household spending made clear. Built for Nigeria.
        </p>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared heading                                                            */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[13px] font-bold tracking-wide text-forest-600 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[26px] font-extrabold leading-tight text-ink-900 sm:text-[32px]">
        {title}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-600 sm:text-[16px]">
        {body}
      </p>
    </div>
  );
}