import { Table } from "@/components/ui/table";
import TokenTableBody from "./TokenTableBody";
import TokenTableHeader from "./TokenTableHeader";

interface TokenTableProps {
  onTokenSelect: (tokenId: string, tokenName: string) => void;
}

const TokenTable: React.FC<TokenTableProps> = ({ onTokenSelect }) => {
  const handleRowClick = (tokenId: string, tokenName: string) => {
    onTokenSelect(tokenId, tokenName);
  };

  return (
    <div className="rounded-lg border-2 border-[#151819] overflow-hidden">
      <Table>
        <TokenTableHeader />
        <TokenTableBody onRowClick={handleRowClick} />
      </Table>
    </div>
  );
};

export default TokenTable;
