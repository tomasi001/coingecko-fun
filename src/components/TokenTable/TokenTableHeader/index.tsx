import TokenTableHeadCell from "../TokenTableHeadCell";
import { tableHeaders } from "@/constants";
import { TableHeader, TableRow } from "@/components/ui/table";
import { useTokenContext } from "@/context/token-context";

const TokenTableHeader = () => {
  const { isLoading, error } = useTokenContext();

  const tableHeaderErrorClassName = error ? "w-full" : "";
  const tableHeaderLoadingClassName = isLoading ? "w-full" : "";
  const tableHeaderClassName = `${tableHeaderErrorClassName} ${tableHeaderLoadingClassName}`;

  return (
    <TableHeader className="h-10">
      <TableRow className="border-1 border-[#151819]">
        <TokenTableHeadCell
          className={`${tableHeaders[0].width} ${tableHeaderClassName}`}
        >
          {tableHeaders[0].name}
        </TokenTableHeadCell>
        {!isLoading && !error && (
          <>
            {tableHeaders.slice(1).map((header, index) => (
              <TokenTableHeadCell key={index} className={header.width}>
                {header.name}
              </TokenTableHeadCell>
            ))}
          </>
        )}
      </TableRow>
    </TableHeader>
  );
};

export default TokenTableHeader;
