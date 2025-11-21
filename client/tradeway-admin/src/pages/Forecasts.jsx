import React, { useState, useEffect } from "react";
import EnhancedLineChart from "../components/EnhancedLineChart";
import "./Forecasts.css";

function Forecasts() {
	const [category, setCategory] = useState("Carrara");
	const [target, setTarget] = useState("price");
	const [horizon, setHorizon] = useState(7);
	const [historicalData, setHistoricalData] = useState([]);
	const [predictions, setPredictions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [confidence, setConfidence] = useState(85);

	// Available marble categories
	const categories = [
		"Carrara",
		"Travertine",
		"Emperador",
		"Calacatta",
		"Onyx",
		"Granite",
	];

	useEffect(() => {
		async function fetchForecasts() {
			try {
				setLoading(true);

				// Generate sample data for testing
				const today = new Date();
				const baseValue = 50 + Math.random() * 20;

				const historicalSeries = Array.from({ length: 30 }, (_, i) => {
					const trend = i * 0.2;
					const volatility = Math.sin(i * 0.5) * 5;
					const noise = (Math.random() - 0.5) * 3;
					return {
						date: new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000),
						value: baseValue + trend + volatility + noise,
						ma: null,
					};
				});

				const maWindow = 5;
				const historicalWithMA = historicalSeries.map((point, idx) => {
					if (idx < maWindow - 1) return { ...point, ma: point.value };

					const maValue =
						historicalSeries
							.slice(idx - maWindow + 1, idx + 1)
							.reduce((sum, p) => sum + p.value, 0) / maWindow;

					return { ...point, ma: maValue };
				});

				const lastValue = historicalSeries[historicalSeries.length - 1].value;
				const predictedSeries = Array.from({ length: horizon }, (_, i) => {
					const futureTrend = i * 0.3;
					const futureVolatility = Math.sin((i + 30) * 0.5) * 6;
					const futureNoise = (Math.random() - 0.5) * (4 + i * 0.2);
					return {
						date: new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
						value: lastValue + futureTrend + futureVolatility + futureNoise,
					};
				});

				setHistoricalData(historicalWithMA);
				setPredictions(predictedSeries);
				setConfidence(85 + Math.random() * 10);
			} catch (err) {
				console.error("Failed to load forecasts:", err);
			} finally {
				setLoading(false);
			}
		}

		fetchForecasts();
	}, [category, target, horizon]);

	if (loading) {
		return <div className="loading">Loading forecasts...</div>;
	}

	const lastActual =
		historicalData.length > 0
			? historicalData[historicalData.length - 1].value
			: 0;

	const avgPrediction =
		predictions.length > 0
			? (
					predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length
			  ).toFixed(2)
			: 0;

	const lastPrediction =
		predictions.length > 0
			? predictions[predictions.length - 1].value
			: lastActual;

	const trendValue =
		lastActual > 0
			? (((lastPrediction - lastActual) / lastActual) * 100).toFixed(1)
			: 0;

	return (
		<div className="forecasts-container fade-in">
			<h2 className="forecasts-title">Market Forecasts</h2>
			<p className="forecasts-subtitle">
				AI-powered predictions with trend and volatility analysis
			</p>

			<div className="grid cols-4">
				<div className="kpi-card">
					<div className="kpi-label">Current Value</div>
					<div className="kpi-value">{lastActual.toFixed(2)}</div>
					<div className="kpi-hint">
						{target === "price" ? "$/unit" : "units"}
					</div>
				</div>

				<div className="kpi-card">
					<div className="kpi-label">Predicted Average</div>
					<div className="kpi-value">{avgPrediction}</div>
					<div className="kpi-hint">next {horizon} days</div>
				</div>

				<div className="kpi-card">
					<div className="kpi-label">Trend</div>
					<div
						className="kpi-value"
						style={{
							color: trendValue > 0 ? "#4CAF50" : "#f44336",
						}}
					>
						{trendValue}%
					</div>
					<div className="kpi-hint">projected change</div>
				</div>

				<div className="kpi-card">
					<div className="kpi-label">Model Confidence</div>
					<div className="kpi-value">{confidence.toFixed(1)}%</div>
					<div className="kpi-hint">based on volatility</div>
				</div>
			</div>

			<div className="controls">
				<select
					value={category}
					onChange={(e) => setCategory(e.target.value)}
					className="input"
				>
					{categories.map((cat) => (
						<option
							key={cat}
							value={cat}
						>
							{cat}
						</option>
					))}
				</select>

				<select
					value={target}
					onChange={(e) => setTarget(e.target.value)}
					className="input"
				>
					<option value="price">Price Forecast</option>
					<option value="demand">Demand Forecast</option>
				</select>

				<select
					value={horizon}
					onChange={(e) => setHorizon(Number(e.target.value))}
					className="input"
				>
					<option value={7}>7 Days</option>
					<option value={14}>14 Days</option>
					<option value={30}>30 Days</option>
				</select>
			</div>

			<div className="chart-container">
				<EnhancedLineChart
					series={[
						{
							name: "Historical Data",
							data: historicalData.map((d) => ({
								date: d.date instanceof Date ? d.date : new Date(d.date),
								value: Number(d.value),
							})),
						},
						{
							name: "Moving Average",
							data: historicalData
								.map((d) => ({
									date: d.date instanceof Date ? d.date : new Date(d.date),
									value: Number(d.ma || d.value),
								}))
								.filter((d) => d.value !== null && !isNaN(d.value)),
						},
						{
							name: "Predicted Values",
							data: predictions.map((d) => ({
								date: d.date instanceof Date ? d.date : new Date(d.date),
								value: Number(d.value),
							})),
						},
					]}
					height={320}
				/>
			</div>

			<div className="forecast-details card">
				<div className="forecast-details-header">
					<h3>Forecast Details</h3>
					<span className="badge primary">AI-Generated</span>
				</div>

				<div className="table-wrapper">
					<table className="table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Predicted Value</th>
								<th>Change</th>
							</tr>
						</thead>
						<tbody>
							{predictions.map((p, i) => {
								const prevValue = i > 0 ? predictions[i - 1].value : lastActual;

								const change = (
									((p.value - prevValue) / prevValue) *
									100
								).toFixed(1);

								return (
									<tr key={p.date.toString()}>
										<td>{p.date.toLocaleDateString()}</td>
										<td className="prediction-value">{p.value.toFixed(2)}</td>
										<td
											className={`prediction-change ${
												change > 0 ? "positive" : "negative"
											}`}
										>
											{change > 0 ? "+" : ""}
											{change}%
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="forecast-insights">
					<div className="insights-header">
						<span className="insights-icon"></span>
						<h3>Forecast Insights</h3>
					</div>
					<p className="insights-text">
						{trendValue > 0
							? `The model predicts an upward trend of ${Math.abs(
									trendValue
							  )}% for ${category} ${target} over the next ${horizon} days. This suggests ${
									target === "price"
										? "increasing market prices"
										: "growing demand"
							  }.`
							: `The model forecasts a downward trend of ${Math.abs(
									trendValue
							  )}% for ${category} ${target} over the next ${horizon} days. Consider ${
									target === "price"
										? "competitive pricing strategies"
										: "inventory adjustments"
							  }.`}
					</p>
				</div>
			</div>
		</div>
	);
}

export default Forecasts;
