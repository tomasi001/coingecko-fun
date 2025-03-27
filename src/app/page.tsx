// CURRENT SOLUTION
"use client";

import { Header, TokenTable, TokenTablePagination } from "@/components";

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto space-y-6">
        <Header />
        <TokenTable />
        <TokenTablePagination />
      </div>
    </main>
  );
}
