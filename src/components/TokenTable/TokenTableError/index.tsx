import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useTokenContext } from "@/context/token-context";

const TokenTableError = () => {
  const { error } = useTokenContext();
  return (
    <TableBody className="w-full">
      <TableRow>
        <TableCell colSpan={8} className="h-36 text-center bg-gray-800">
          <p className="text-red-500">
            Error:{" "}
            {error && error.message
              ? error.message
              : "An error has occurred, please try again later"}
          </p>
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

export default TokenTableError;
