import { TableHead } from "@/components/ui/table";

const TokenTableHeadCell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <TableHead
    className={`h-10 text-muted-foreground text-sm font-medium border-0 bg-[#151819] pl-2.5 ${className}`}
  >
    {children}
  </TableHead>
);

export default TokenTableHeadCell;
