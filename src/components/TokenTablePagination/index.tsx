import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTokenContext } from "@/context/token-context";

const TokenTablePagination = () => {
  const { tokens, currentPage, setCurrentPage, itemsPerPage, setItemsPerPage } =
    useTokenContext();

  // Pagination calculations
  const totalPages = Math.ceil(tokens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Helper function to determine which page numbers to display
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  return (
    <div className="flex flex-row justify-between items-center p-0 gap-8 w-full h-10 px-2.5">
      <div className="text-[12px] font-medium text-[#9E9E9E] font-['Instrument_Sans'] w-1/6 leading-[16px]] tracking-wide">
        Showing {Math.min(endIndex, tokens.length)} of {tokens.length} results
      </div>
      <Pagination>
        <PaginationContent className="flex flex-row items-center gap-2 h-10">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              className={
                currentPage === 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {getVisiblePages().map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
                className={
                  currentPage === page
                    ? "flex justify-center items-center p-3 w-10 h-10 bg-[rgba(24,134,225,0.2)] rounded-lg border-0"
                    : "flex justify-center items-center p-3 w-10 h-10 border-0"
                }
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                currentPage < totalPages && setCurrentPage(currentPage + 1)
              }
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <div className="flex flex-row items-center p-0 gap-2 w-28 h-10 mx-auto">
        <span className="text-[#9E9E9E] text-[12px] font-medium">Rows</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => setItemsPerPage(Number(value))}
        >
          <SelectTrigger className="bg-[rgba(255,255,255,0.03)] border border-[#2A2A2A] rounded-lg w-28 h-10 px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TokenTablePagination;
