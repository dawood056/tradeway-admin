import { Line } from "react-chartjs-2";
import {
	Chart,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
	Tooltip,
	Legend,
} from "chart.js";
Chart.register(
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
	Tooltip,
	Legend
);

export default function LineChart({ labels, series, title }) {
	const data = {
		labels,
		datasets: series.map((s) => ({
			label: s.name,
			data: s.data,
			tension: 0.25,
			pointRadius: 4,
			borderWidth: 2,
			borderColor: s.name.includes("Actual") ? "#4f8eff" : "#73a6ff",
			backgroundColor: s.name.includes("Actual") ? "#4f8eff" : "#73a6ff",
			pointBackgroundColor: s.name.includes("Actual")
				? "#ff4f4fff"
				: "#ff7373ff",
			fill: false,
		})),
	};
	const options = {
		plugins: {
			legend: {
				labels: {
					color: "var(--text)",
					font: {
						size: 12,
						weight: "bold",
					},
				},
			},
			tooltip: {
				mode: "index",
				intersect: false,
				backgroundColor: "var(--card)",
				titleColor: "var(--text)",
				bodyColor: "var(--text-secondary)",
				borderColor: "var(--border)",
				borderWidth: 1,
				padding: 12,
				boxShadow: "0 4px 12px var(--shadow)",
			},
		},
		scales: {
			x: {
				ticks: { color: "var(--chart-text-secondary)" },
				grid: { color: "var(--chart-grid)" },
			},
			y: {
				ticks: { color: "var(--chart-text-secondary)" },
				grid: { color: "var(--chart-grid)" },
			},
		},
		maintainAspectRatio: false,
	};
	return (
		<div
			className="card"
			style={{ height: 320 }}
		>
			<div style={{ marginBottom: 8 }}>{title}</div>
			<Line
				data={data}
				options={options}
			/>
		</div>
	);
}
