import { Bar } from "react-chartjs-2";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { ArrowRight } from "lucide-react";
import type { Order } from "../../orders/types/order";

ChartJS.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip);

const trackedStatuses = [
  { label: "Received", color: "#8974dc" },
  { label: "Washing", color: "#3b82f6" },
  { label: "Ready for Pickup", color: "#2e694f" },
  { label: "Out for Delivery", color: "#e8833a" },
] as const;

type OrderStatusChartProps = {
  orders: Order[];
  onViewOrders: () => void;
};

export default function OrderStatusChart({ orders, onViewOrders }: OrderStatusChartProps) {
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const counts = trackedStatuses.map(({ label }) => orders.filter((order) => order.status === label).length);
  const chartData = {
    labels: ["Received", "Washing", ["Ready for", "Pickup"], ["Out for", "Delivery"]],
    datasets: [{
      label: "Orders",
      data: counts,
      backgroundColor: trackedStatuses.map(({ color }) => color),
      borderRadius: 6,
      borderSkipped: false as const,
      categoryPercentage: 0.94,
      barPercentage: 0.96,
      maxBarThickness: 54,
    }],
  };
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reduceMotion ? false : { duration: 240 },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} ${context.parsed.y === 1 ? "order" : "orders"}`,
        },
      },
    },
    scales: {
      x: {
        type: "category",
        ticks: { color: "#34423a", font: { family: "DM Sans", size: 12, weight: 600 }, padding: 8, maxRotation: 0, minRotation: 0, autoSkip: false },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        suggestedMax: Math.max(...counts, 1),
        ticks: { precision: 0, stepSize: 1, color: "#5d6a63", font: { family: "DM Sans", size: 12 } },
        grid: { color: "#e9ece8", drawTicks: false },
        border: { display: false },
      },
    },
    layout: { padding: { right: 8 } },
  };

  return (
    <section className="panel status-chart-panel" aria-labelledby="order-status-title">
      <div className="panel-heading">
        <div>
          <h2 id="order-status-title">Orders by status</h2>
          <p>Current orders in the main handoff stages.</p>
        </div>
        <button className="text-link" onClick={onViewOrders}>View orders <ArrowRight size={15} /></button>
      </div>
      <div className="status-chart-content">
        <div className="status-chart-canvas">
          <Bar data={chartData} options={options} role="img" aria-label="Vertical bar chart showing order counts for received, washing, ready for pickup, and out for delivery" />
        </div>
        <ul className="status-chart-summary" aria-label="Order counts by status">
          {trackedStatuses.map(({ label, color }, index) => (
            <li key={label}>
              <span className="status-chart-key" style={{ backgroundColor: color }} />
              <span>{label}</span>
              <b>{counts[index]}</b>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
