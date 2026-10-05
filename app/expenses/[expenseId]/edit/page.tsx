import type { Metadata } from "next";
import { Suspense } from "react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export const metadata: Metadata = {
  title: "Edit expense",
  description: "Change an expense. Previous values are kept in its history.",
};

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ expenseId: string }>;
}) {
  const { expenseId } = await params;

  return (
    <Suspense fallback={null}>
      <ExpenseForm expenseId={expenseId} />
    </Suspense>
  );
}