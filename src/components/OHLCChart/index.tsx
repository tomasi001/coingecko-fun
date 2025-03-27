import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTokenContext } from "@/context/token-context";

interface OHLCChartProps {
  tokenId: string;
  tokenName: string;
}

const OHLCChart: React.FC<OHLCChartProps> = ({ tokenId, tokenName }) => {
  const { ethereumOHLC, averOHLC, isOHLCLoading } = useTokenContext();

  // Get the appropriate OHLC data based on tokenId
  const chartData = tokenId === "ethereum" ? ethereumOHLC : averOHLC;

  // Format the timestamp for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (isOHLCLoading) {
    return (
      <div className="flex justify-center items-center h-[400px] bg-[#151819] rounded-lg p-4 mt-6 border-2 border-[#1f2425]">
        <div className="animate-pulse text-gray-400">Loading chart data...</div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px] bg-[#151819] rounded-lg p-4 mt-6 border-2 border-[#1f2425]">
        <div className="text-gray-400">
          No chart data available for {tokenName}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#151819] rounded-lg p-4 mt-6 border-2 border-[#1f2425]">
      <h2 className="text-xl font-bold mb-4 text-white">
        {tokenName} - 7 Day OHLC Chart
      </h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              stroke="#8A8A8A"
              label={{
                value: "Date",
                position: "insideBottomRight",
                offset: 0,
                fill: "#8A8A8A",
              }}
            />
            <YAxis
              stroke="#8A8A8A"
              label={{
                value: "Price (USD)",
                angle: -90,
                position: "insideLeft",
                fill: "#8A8A8A",
              }}
            />
            <Tooltip
              labelFormatter={(value) => formatDate(value as number)}
              formatter={(value) => [
                `$${parseFloat(value as string).toFixed(2)}`,
                "",
              ]}
              contentStyle={{
                backgroundColor: "#1f2425",
                borderColor: "#333",
                color: "white",
              }}
            />
            <Legend wrapperStyle={{ color: "white" }} />
            <Line type="monotone" dataKey="open" stroke="#8884d8" name="Open" />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#82ca9d"
              name="Close"
            />
            <Line type="monotone" dataKey="high" stroke="#ff7300" name="High" />
            <Line type="monotone" dataKey="low" stroke="#0088fe" name="Low" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OHLCChart;
