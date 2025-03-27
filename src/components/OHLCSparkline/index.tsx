import { Line } from "react-chartjs-2";
import { OHLCData } from "@/types";
import { LoadingIndicator } from "@/components";

interface OHLCSparklineProps {
  data: OHLCData | undefined;
  isLoading: boolean;
}

const OHLCSparkline = ({ data, isLoading }: OHLCSparklineProps) => {
  if (isLoading || !data) {
    return (
      <div className="w-32 h-[64px] flex items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  // Extract close prices for the sparkline
  const closeValues = data.map((point) => point.close);

  // Determine color based on trend (green if trending up, red if down)
  const trendColor =
    closeValues[0] < closeValues[closeValues.length - 1]
      ? "rgb(34, 197, 94)" // green
      : "rgb(239, 68, 68)"; // red

  return (
    <div className="w-32 h-[64px]">
      <Line
        data={{
          labels: [...Array(closeValues.length)].map((_, i) => i),
          datasets: [
            {
              data: closeValues,
              borderColor: trendColor,
              borderWidth: 1.5,
              tension: 0.4,
              pointRadius: 0,
              fill: false,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        }}
      />
    </div>
  );
};

export default OHLCSparkline;
