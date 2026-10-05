import type { Metadata } from "next";
import { Suspense } from "react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export const metadata: Metadata = {
  title: "Add expense",
  description: "Record an expense against one of your funds.",
};

export default function NewExpensePage() {
  return (
    <Suspense fallback={null}>
      <ExpenseForm />
    </Suspense>
  );
}