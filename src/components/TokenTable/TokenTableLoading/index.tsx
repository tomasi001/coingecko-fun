import { LoadingIndicator } from "@/components";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

const TokenTableLoading = () => {
  return (
    <TableBody className="w-full">
      <TableRow>
        <TableCell
          colSpan={8}
          className="flex h-36 w-full items-center justify-center text-center animate-pulse"
        >
          <LoadingIndicator />
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

export default TokenTableLoading;
