// Extract components for better organization
const PriceChange = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  const arrow = isPositive ? "▲" : "▼";
  return (
    <span className={isPositive ? "text-green-500" : "text-red-500"}>
      {arrow} {Math.abs(value).toFixed(1)}%
    </span>
  );
};

export default PriceChange;
