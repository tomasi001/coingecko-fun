// CURRENT SOLUTION
"use client";

import {
  Header,
  OHLCChart,
  TokenTable,
  TokenTablePagination,
} from "@/components";
import { useState } from "react";

export default function Home() {
  const [selectedToken, setSelectedToken] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleTokenSelect = (tokenId: string, tokenName: string) => {
    // Toggle the chart if clicking the same token again
    if (selectedToken && selectedToken.id === tokenId) {
      setSelectedToken(null);
    } else {
      setSelectedToken({ id: tokenId, name: tokenName });
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto space-y-6">
        <Header />
        <TokenTable onTokenSelect={handleTokenSelect} />
        <TokenTablePagination />

        {selectedToken && (
          <OHLCChart
            tokenId={selectedToken.id}
            tokenName={selectedToken.name}
          />
        )}
      </div>
    </main>
  );
}
