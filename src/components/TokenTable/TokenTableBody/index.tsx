import { OHLCSparkline, PriceChange, Sparkline } from "@/components";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useTokenContext } from "@/context/token-context";
import Image from "next/image";
import TokenTableError from "../TokenTableError";
import TokenTableLoading from "../TokenTableLoading";

interface TokenTableBodyProps {
  onRowClick?: (tokenId: string, tokenName: string) => void;
}

const TokenTableBody: React.FC<TokenTableBodyProps> = ({ onRowClick }) => {
  const { tokens, isLoading, error, ethereumOHLC, averOHLC, isOHLCLoading } =
    useTokenContext();

  if (error) return <TokenTableError />;
  if (isLoading) return <TokenTableLoading />;

  return (
    <TableBody className="w-full">
      {tokens.map((token) => {
        const ohlcData = token.id === "ethereum" ? ethereumOHLC : averOHLC;

        // Define cell data with content and width
        const cellsData = [
          {
            className: "pl-2.5 w-1/3",
            content: (
              <div className="flex items-center gap-2">
                <Image
                  src={token.image}
                  alt={token.name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="text-white font-['Instrument_Sans'] font-medium text-sm">
                  {token.name}
                </span>
                <span className="text-[#8A8A8A] uppercase text-xs font-medium">
                  {token.symbol}
                </span>
              </div>
            ),
          },
          {
            className: "w-[8.33%]",
            content: `$${token.current_price.toLocaleString()}`,
          },
          {
            className: "w-[8.33%]",
            content: <PriceChange value={token.price_change_percentage_1h} />,
          },
          {
            className: "w-[8.33%]",
            content: <PriceChange value={token.price_change_percentage_24h} />,
          },
          {
            className: "w-[8.33%]",
            content: <PriceChange value={token.price_change_percentage_7d} />,
          },
          {
            className: "w-[11.1%]",
            content: `$${token.total_volume.toLocaleString()}`,
          },
          {
            className: "w-[11.1%]",
            content: `$${token.market_cap.toLocaleString()}`,
          },
          {
            className: "w-[11.1%]",
            content: ohlcData ? (
              <OHLCSparkline data={ohlcData} isLoading={isOHLCLoading} />
            ) : (
              <Sparkline data={token.sparkline_data} />
            ),
          },
        ];

        return (
          <TableRow
            key={token.id}
            className="border-0 hover:bg-[#1f2425] h-16 cursor-pointer"
            onClick={() => onRowClick && onRowClick(token.id, token.name)}
          >
            {cellsData.map((cell, index) => (
              <TableCell key={index} className={cell.className}>
                {cell.content}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </TableBody>
  );
};

export default TokenTableBody;
