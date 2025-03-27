import { OHLCSparkline, PriceChange, Sparkline } from "@/components";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useTokenContext } from "@/context/token-context";
import Image from "next/image";
import TokenTableError from "../TokenTableError";
import TokenTableLoading from "../TokenTableLoading";

const TokenTableBody = () => {
  const { tokens, isLoading, error, ethereumOHLC, averOHLC, isOHLCLoading } =
    useTokenContext();

  if (error) {
    return <TokenTableError />;
  }

  if (isLoading) {
    return <TokenTableLoading />;
  }

  return (
    <TableBody className="w-full">
      {tokens.map((token) => {
        // Determine which OHLC data to use based on token ID
        const ohlcData = token.id === "ethereum" ? ethereumOHLC : averOHLC;

        return (
          <TableRow key={token.id} className="border-0 hover:bg-[#1f2425] h-16">
            <TableCell className="pl-2.5 w-1/3">
              <div className="flex items-center gap-2">
                <Image
                  src={token.image}
                  alt={token.name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />{" "}
                <span className="text-white font-['Instrument_Sans'] font-medium text-sm">
                  {token.name}
                </span>{" "}
                <span className="text-[#8A8A8A] uppercase text-xs font-medium">
                  {token.symbol}
                </span>
              </div>
            </TableCell>
            <TableCell className="w-[8.33%]">
              ${token.current_price.toLocaleString()}
            </TableCell>
            <TableCell className="w-[8.33%]">
              <PriceChange value={token.price_change_percentage_1h} />
            </TableCell>
            <TableCell className="w-[8.33%]">
              <PriceChange value={token.price_change_percentage_24h} />
            </TableCell>
            <TableCell className="w-[8.33%]">
              <PriceChange value={token.price_change_percentage_7d} />
            </TableCell>
            <TableCell className="w-[11.1%]">
              ${token.total_volume.toLocaleString()}
            </TableCell>
            <TableCell className="w-[11.1%]">
              ${token.market_cap.toLocaleString()}
            </TableCell>
            <TableCell className="w-[11.1%]">
              {/* Use OHLC data for sparkline if available, otherwise fall back to regular sparkline */}
              {ohlcData ? (
                <OHLCSparkline data={ohlcData} isLoading={isOHLCLoading} />
              ) : (
                <Sparkline data={token.sparkline_data} />
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  );
};

export default TokenTableBody;
