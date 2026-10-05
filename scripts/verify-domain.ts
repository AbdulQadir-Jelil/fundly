/**
 * Domain smoke test.
 *
 * Runs the real seed data through the real selectors and validators so the
 * money maths, category splits and form rules are verified rather than
 * assumed. Uses Node's native TypeScript stripping — no test framework.
 *
 *   npm run verify
 */

import assert from "node:assert/strict";
import { cloneSeed, SEED_VERSION } from "@/lib/data/seed";
import {
  getCategoryBreakdown,
  getFundActivity,
  getFundTotals,
  getHouseholdTotals,
  buildShareText,
  getShareReportData,
  fundAccentFor,
} from "@/lib/selectors";
import {
  formatNaira,
  formatNumber,
  parseAmount,
  isPositiveAmount,
  clampPercent,
} from "@/lib/currency";
import {
  validateAmount,
  validateFundName,
  validateExpense,
  validateSignUp,
  validateLogin,
  validateInvite,
  hasErrors,
  validateFullName,
  validateDate,
} from "@/lib/validations";
import { categoryLabel, moneySourceLabel, CATEGORY_LIST } from "@/lib/categories";
import { formatFriendlyDate, greetingFor } from "@/lib/date";
import type { Fund } from "@/types";

let passed = 0;
let failed = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(
      `        ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function group(title: string) {
  console.log(`\n${title}`);
}

const data = cloneSeed();

group("Seed data integrity");

check("version is stable", () => {
  assert.equal(typeof SEED_VERSION, "number");
  assert.ok(SEED_VERSION > 0);
});

check("cloneSeed returns independent copies", () => {
  const a = cloneSeed();
  const b = cloneSeed();
  assert.notEqual(a.funds, b.funds, "funds array is shared");
  a.funds[0]!.name = "MUTATED";
  assert.notEqual(b.funds[0]!.name, "MUTATED", "mutation leaked across clones");
  assert.notEqual(
    data.funds[0]!.name,
    "MUTATED",
    "mutation leaked into the shared seed",
  );
});

check("every record references a real fund", () => {
  const ids = new Set(data.funds.map((f) => f.id));
  for (const tx of data.transactions) {
    assert.ok(ids.has(tx.fundId), `transaction ${tx.id} has no fund`);
  }
  for (const expense of data.expenses) {
    assert.ok(ids.has(expense.fundId), `expense ${expense.id} has no fund`);
  }
});

check("every expense has a known category and sane values", () => {
  const known = new Set<string>(CATEGORY_LIST.map((c) => c.value));
  for (const expense of data.expenses) {
    assert.ok(known.has(expense.category), `bad category ${expense.category}`);
    assert.ok(expense.amount > 0, "amount must be positive");
    assert.ok(expense.description.trim().length > 0, "description required");
  }
});

check("money-in amounts are all positive", () => {
  for (const tx of data.transactions) {
    assert.ok(tx.amount > 0, `transaction ${tx.id} has a non-positive amount`);
  }
});

/* -------------------------------------------------------------------------- */

group("Fund totals");

const groceries = data.funds.find((f) => f.id === "fund_groceries");
const school = data.funds.find((f) => f.id === "fund_school");

check("House Groceries matches the documented figures", () => {
  assert.ok(groceries, "fund exists");
  const totals = getFundTotals(groceries!, data.transactions, data.expenses);
  assert.equal(totals.received, 50000);
  assert.equal(totals.spent, 27500);
  assert.equal(totals.remaining, 22500);
  assert.equal(totals.spentPercent, 55);
  // Rice 12,000 + Chicken 8,500 + Vegetables 4,000 + Transport 3,000
  assert.equal(totals.expenseCount, 4);
  assert.equal(totals.transactionCount, 1);
});

check("School Expenses matches the documented figures", () => {
  assert.ok(school, "fund exists");
  const totals = getFundTotals(school!, data.transactions, data.expenses);
  assert.equal(totals.received, 80000);
  assert.equal(totals.spent, 35000);
  assert.equal(totals.remaining, 45000);
  assert.equal(totals.spentPercent, 43.75);
});

check("household totals equal the sum of every fund's totals", () => {
  const household = getHouseholdTotals(data);

  const summed = data.funds.reduce(
    (acc, fund) => {
      const totals = getFundTotals(fund, data.transactions, data.expenses);
      return {
        received: acc.received + totals.received,
        spent: acc.spent + totals.spent,
        expenses: acc.expenses + totals.expenseCount,
      };
    },
    { received: 0, spent: 0, expenses: 0 },
  );

  assert.equal(household.received, summed.received, "received drift");
  assert.equal(household.spent, summed.spent, "spent drift");
  assert.equal(household.expenseCount, summed.expenses, "expense count drift");
  assert.equal(household.remaining, household.received - household.spent);
});

check("remaining always equals received minus spent", () => {
  for (const fund of data.funds) {
    const totals = getFundTotals(fund, data.transactions, data.expenses);
    assert.equal(totals.remaining, totals.received - totals.spent);
    assert.ok(totals.spentPercent >= 0 && totals.spentPercent <= 100);
  }
});

check("an empty fund reports zeroes rather than NaN", () => {
  const empty: Fund = {
    id: "fund_empty",
    name: "Empty",
    purpose: "None",
    source: "me",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "usr_alex",
  };
  assert.deepEqual(getFundTotals(empty, data.transactions, data.expenses), {
    received: 0,
    spent: 0,
    remaining: 0,
    spentPercent: 0,
    expenseCount: 0,
    transactionCount: 0,
  });
});

check("overspending yields a negative balance, not a wrapped one", () => {
  // Give the fund a single ₦1,000 top-up but keep its ₦27,500 of expenses.
  const totals = getFundTotals(
    groceries!,
    [
      {
        id: "txn_small",
        fundId: groceries!.id,
        kind: "topup",
        amount: 1000,
        source: "me",
        createdAt: new Date().toISOString(),
        createdBy: "usr_alex",
      },
    ],
    data.expenses,
  );

  assert.ok(totals.remaining < 0, "remaining should be negative");
  assert.equal(totals.remaining, 1000 - totals.spent);
  assert.equal(totals.spentPercent, 100, "progress clamps at 100%");
});

/* -------------------------------------------------------------------------- */

group("Category breakdown");

check("splits are sorted largest first and sum to total spend", () => {
  const expenses = data.expenses.filter((e) => e.fundId === groceries!.id);
  const breakdown = getCategoryBreakdown(expenses);
  assert.ok(breakdown.length > 0);
  assert.equal(
    breakdown.reduce((sum, entry) => sum + entry.amount, 0),
    expenses.reduce((sum, e) => sum + e.amount, 0),
    "breakdown must sum to the same total as the expenses",
  );
  for (let i = 1; i < breakdown.length; i += 1) {
    assert.ok(
      (breakdown[i - 1]?.amount ?? 0) >= (breakdown[i]?.amount ?? 0),
      "breakdown not sorted descending",
    );
  }
});

check("percentages stay within 0-100 and counts match", () => {
  for (const entry of getCategoryBreakdown(data.expenses)) {
    assert.ok(entry.percent >= 0 && entry.percent <= 100);
    assert.equal(
      entry.count,
      data.expenses.filter((e) => e.category === entry.category).length,
    );
  }
});

check("empty expense list produces an empty breakdown", () => {
  assert.deepEqual(getCategoryBreakdown([]), []);
});

group("Activity feed");

check("fund activity is newest-first and complete", () => {
  const items = getFundActivity(data, "fund_groceries");
  assert.ok(items.length > 0);
  for (let i = 1; i < items.length; i += 1) {
    assert.ok(
      new Date(items[i - 1]!.date).getTime() >= new Date(items[i]!.date).getTime(),
      "activity must be sorted newest-first",
    );
  }
  const expected =
    data.transactions.filter((t) => t.fundId === "fund_groceries").length +
    data.expenses.filter((e) => e.fundId === "fund_groceries").length;
  assert.equal(items.length, expected);
});

check("money in is positive and expenses are negative", () => {
  for (const item of getFundActivity(data, "fund_groceries")) {
    if (item.type === "money-in" || item.type === "fund-created") {
      assert.ok((item.amount ?? 0) > 0, `${item.title} should be positive`);
    }
    if (item.type === "expense" || item.type === "expense-edited") {
      assert.ok((item.amount ?? 0) < 0, `${item.title} should be negative`);
    }
  }
});

check("an edited expense is flagged as edited in the timeline", () => {
  const edited = data.expenses.filter((e) => e.revisions.length > 0);
  assert.ok(edited.length > 0, "seed should include an edited expense");

  for (const expense of edited) {
    assert.equal(expense.edited, true, "edited flag not set");

    const match = getFundActivity(data, expense.fundId).find(
      (item) => item.id === expense.id,
    );
    assert.ok(match, "edited expense missing from the timeline");
    assert.equal(match.type, "expense-edited");
    assert.equal(match.badge, "Edited");
    // The current amount is what counts toward the balance, not the old one.
    assert.equal(match.amount, -expense.amount);
  }
});

check("the edit trail preserves the previous amount", () => {
  const rice = data.expenses.find((e) => e.id === "exp_rice");
  assert.ok(rice, "seed expense exists");
  assert.equal(rice!.revisions.length, 1);
  assert.equal(rice!.revisions[0]!.amount, 11_500);
  assert.equal(rice!.amount, 12_000, "the live amount must be the latest value");
  assert.ok(
    (rice!.revisions[0]!.summary ?? "").includes("11,500"),
    "revision summary should name the old amount",
  );
});

check("unknown funds yield no activity rather than throwing", () => {
  assert.deepEqual(getFundActivity(data, "fund_does_not_exist"), []);
});

/* -------------------------------------------------------------------------- */

group("Currency helpers");

check("formats whole naira with the symbol", () => {
  assert.equal(formatNaira(50000).replace(/ /g, " "), "₦50,000");
  assert.equal(formatNaira(0), "₦0");
});

check("handles non-finite input safely", () => {
  assert.equal(formatNaira(Number.NaN), "₦0");
  assert.equal(formatNaira(Number.POSITIVE_INFINITY), "₦0");
});

check("parses every shape a user might type", () => {
  assert.equal(parseAmount("₦50,000"), 50000);
  assert.equal(parseAmount("50 000"), 50000);
  assert.equal(parseAmount("₦ 12 500.50"), 12500.5);
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount("abc"), null);
  assert.equal(parseAmount("₦"), null);
});

check("isPositiveAmount rejects zero and negatives", () => {
  assert.equal(isPositiveAmount(1), true);
  assert.equal(isPositiveAmount(0), false);
  assert.equal(isPositiveAmount(-5), false);
  assert.equal(isPositiveAmount(null), false);
});

check("grouping and clamping behave", () => {
  assert.equal(formatNumber(1234567), "1,234,567");
  assert.equal(clampPercent(-10), 0);
  assert.equal(clampPercent(150), 100);
  assert.equal(clampPercent(Number.NaN), 0);
});

group("Validation rules");

check("amount rejects empty, zero, negatives and absurd values", () => {
  assert.ok(validateAmount(""));
  assert.ok(validateAmount("0"));
  assert.ok(validateAmount("-500"));
  assert.ok(validateAmount("abc"));
  assert.ok(validateAmount("9999999999"));
  assert.equal(validateAmount("10,000"), null);
});

check("fund name length is bounded", () => {
  assert.ok(validateFundName(""));
  assert.ok(validateFundName("A"));
  assert.ok(validateFundName("x".repeat(61)));
  assert.equal(validateFundName("School Expenses"), null);
});

check("sign-up requires a full name and a strong password", () => {
  assert.ok(validateFullName("Alex")?.includes("first and last"));
  assert.ok(
    hasErrors(validateSignUp({ name: "", identifier: "", password: "" })),
  );
  assert.ok(
    validateSignUp({
      name: "Alex Johnson",
      identifier: "not-an-email",
      password: "short",
    }).password,
  );
  assert.equal(
    hasErrors(
      validateSignUp({
        name: "Alex Johnson",
        identifier: "alex@example.com",
        password: "password1",
      }),
    ),
    false,
    "a valid sign-up must produce no errors",
  );
});

check("login accepts a phone number as an identifier", () => {
  assert.equal(
    hasErrors(validateLogin({ identifier: "+2348012345678", password: "x" })),
    false,
  );
  assert.ok(hasErrors(validateLogin({ identifier: "nope", password: "x" })));
});

check("future dates are blocked, today is allowed", () => {
  const future = new Date();
  future.setDate(future.getDate() + 5);
  assert.ok(validateDate(future.toISOString()));
  assert.equal(validateDate(new Date().toISOString()), null);
  assert.ok(validateDate(""));
});

check("expense validation catches each missing field", () => {
  const errors = validateExpense({
    description: "",
    amount: "",
    category: "",
    date: "",
    note: "",
  });
  assert.ok(errors.description);
  assert.ok(errors.amount);
  assert.ok(errors.category);
  assert.ok(errors.date);

  assert.equal(
    hasErrors(
      validateExpense({
        description: "Rice and vegetables",
        amount: "5000",
        category: "food",
        date: new Date().toISOString(),
        note: "",
      }),
    ),
    false,
    "a complete expense must validate",
  );
});

check("invite validation requires a name and relationship", () => {
  assert.ok(hasErrors(validateInvite({ name: "", relationship: "" })));
  assert.equal(
    hasErrors(validateInvite({ name: "Aisha", relationship: "Partner" })),
    false,
  );
});

/* -------------------------------------------------------------------------- */

group("Sharing and presentation");

check("share report matches the fund it describes", () => {
  const report = getShareReportData(data, "fund_groceries");
  assert.ok(report, "report exists");
  assert.equal(report!.fundName, "House Groceries");
  assert.equal(report!.received, 50000);
  assert.equal(report!.spent, 27500);
  assert.equal(report!.remaining, 22500);
});

check("share text contains the headline figures", () => {
  const text = buildShareText(getShareReportData(data, "fund_groceries")!);
  assert.ok(text.includes("House Groceries"));
  assert.ok(text.includes("₦50,000"), "received missing");
  assert.ok(text.includes("₦27,500"), "spent missing");
  assert.ok(text.includes("₦22,500"), "remaining missing");
  assert.ok(text.length < 400, `message too long for a chat: ${text.length}`);
});

check("share report returns null for an unknown fund", () => {
  assert.equal(getShareReportData(data, "nope"), null);
});

check("every category and money source has a label", () => {
  for (const meta of CATEGORY_LIST) {
    assert.ok(categoryLabel(meta.value).length > 0);
  }
  assert.equal(moneySourceLabel("me"), "Me");
  assert.equal(moneySourceLabel("household"), "Household");
});

check("every fund resolves an accent icon", () => {
  for (const fund of data.funds) {
    const accent = fundAccentFor(fund);
    assert.ok(accent.icon, `no icon for ${fund.name}`);
    assert.ok(accent.chip.startsWith("bg-"), `bad chip for ${fund.name}`);
  }
});

check("dates render as words, never as raw ISO", () => {
  const label = formatFriendlyDate("2025-04-28T10:00:00.000Z");
  assert.ok(label !== "2025-04-28", "raw ISO leaked into the UI");
  assert.ok(label.length > 0);
});

check("greeting varies by hour", () => {
  const greetings = [3, 14, 20].map((hour) =>
    greetingFor(new Date(2025, 0, 1, hour, 0, 0)),
  );
  assert.equal(new Set(greetings).size, 3, "all three greetings should differ");
});

/* -------------------------------------------------------------------------- */

console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total\n`);

process.exit(failed === 0 ? 0 : 1);