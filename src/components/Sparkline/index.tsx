import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Sparkline = ({ data }: { data: number[] }) => (
  <div className="w-32 h-[64px]">
    <Line
      data={{
        labels: [...Array(data.length)].map((_, i) => i),
        datasets: [
          {
            data: data,
            borderColor:
              data[0] < data[data.length - 1]
                ? "rgb(34, 197, 94)"
                : "rgb(239, 68, 68)",
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

export default Sparkline;
