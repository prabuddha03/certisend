import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions: ChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
      ticks: {
        color: '#71717a',
      },
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
      ticks: {
        color: '#71717a',
      },
    },
  },
};

interface ChartData {
  date?: string;
  label?: string;
  value: number;
}

export function LineChart({ data, title }: { data: ChartData[]; title: string }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: title,
        data: data.map(d => d.value),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.4,
      },
    ],
  };

  return <Line options={chartOptions} data={chartData} />;
}

export function BarChart({ data, title }: { data: ChartData[]; title: string }) {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: title,
        data: data.map(d => d.value),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  };

  return <Bar options={chartOptions} data={chartData} />;
}