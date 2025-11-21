import React from "react";
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
	TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale
);

function EnhancedLineChart({ series = [], height = 240 }) {
	const chartData = {
		datasets: series.map((s) => ({
			label: s.name,
			data: s.data.map((d) => ({
				x: new Date(d.date),
				y: d.value,
			})),
			tension: 0.4,
			pointRadius: s.name.includes("Predicted") ? 4 : 2,
			borderWidth: 2,
			borderColor: s.name.includes("Predicted")
				? "#22c55e" // success color
				: s.name.includes("Moving Average")
				? "#f59e0b" // warning color
				: "#3b82f6", // primary color
			backgroundColor: s.name.includes("Predicted")
				? "#22c55e" // success color
				: s.name.includes("Moving Average")
				? "#f50b0bff" // warning color
				: "#3b82f6", // primary color
			fill: false,
			...(s.name.includes("Moving Average") && {
				borderWidth: 1.5,
				borderDash: [5, 5],
				pointRadius: 0,
			}),
		})),
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		interaction: {
			intersect: false,
			mode: "index",
		},
		plugins: {
			legend: {
				display: true,
				position: "top",
				labels: {
					color: "var(--text)",
					font: {
						weight: "bold",
						family:
							"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif",
					},
					usePointStyle: true,
					padding: 16,
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
				callbacks: {
					label: function (context) {
						return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
					},
				},
			},
		},
		scales: {
			x: {
				type: "time",
				time: {
					unit: "day",
					displayFormats: {
						day: "MMM d",
					},
				},
				grid: {
					color: "var(--border)",
					lineWidth: 0.5,
					display: true,
					drawBorder: false,
				},
				ticks: {
					color: "var(--text-secondary)",
					maxTicksLimit: 8,
					font: {
						size: 11,
						family:
							"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif",
					},
					padding: 8,
				},
				border: { display: false },
			},
			y: {
				grid: {
					color: "var(--border)",
					lineWidth: 0.5,
					display: true,
					drawBorder: false,
				},
				ticks: {
					color: "var(--text-secondary)",
					font: {
						size: 11,
						family:
							"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif",
					},
					callback: function (value) {
						return value.toFixed(1);
					},
				},
				beginAtZero: true,
			},
		},
	};

	return (
		<div style={{ height }}>
			<Line
				data={chartData}
				options={options}
			/>
		</div>
	);
}

export default EnhancedLineChart;
