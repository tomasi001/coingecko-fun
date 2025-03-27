import { Table } from "@/components/ui/table";
import TokenTableBody from "./TokenTableBody";
import TokenTableHeader from "./TokenTableHeader";

const TokenTable = () => (
  <div className="rounded-lg border-2 border-[#151819] overflow-hidden">
    <Table>
      <TokenTableHeader />
      <TokenTableBody />
    </Table>
  </div>
);

export default TokenTable;
