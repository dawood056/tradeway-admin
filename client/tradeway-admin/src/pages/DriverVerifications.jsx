import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusOptions = [
	{ value: "pending", label: "Pending" },
	{ value: "approved", label: "Approved" },
	{ value: "rejected", label: "Rejected" },
	{ value: "all", label: "All" },
];

export default function DriverVerifications() {
	const { user } = useAuth();
	const canDecide = user?.role === "admin";
	const [items, setItems] = useState([]);
	const [counts, setCounts] = useState({
		pending: 0,
		approved: 0,
		rejected: 0,
	});
	const [status, setStatus] = useState("pending");
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [actionId, setActionId] = useState(null);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return items;
		return items.filter((item) => {
			const haystack = [
				item?.name,
				item?.cnic,
				item?.licenseNumber,
				item?.driverId?.fullName,
				item?.driverId?.email,
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(q);
		});
	}, [items, search]);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const { data } = await api.get("/api/admin/driver-verifications", {
				params: { status },
			});
			setItems(Array.isArray(data?.items) ? data.items : []);
			setCounts(data?.counts || { pending: 0, approved: 0, rejected: 0 });
		} catch (err) {
			console.error("Failed to load verifications", err);
			setError(err?.response?.data?.error || err.message || "Failed to load");
		} finally {
			setLoading(false);
		}
	}, [status]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleAction(id, type) {
		if (!id || !canDecide) return;
		if (type === "reject") {
			const note = window.prompt(
				"Add a rejection note (optional):",
				"Missing/invalid documents"
			);
			if (note === null) return; // user cancelled
			await runAction(id, "/reject", { reason: note });
		} else {
			await runAction(id, "/approve");
		}
	}

	async function runAction(id, suffix, payload) {
		try {
			setActionId(id);
			await api.post(`/api/admin/driver-verifications/${id}${suffix}`, payload);
			await load();
		} catch (err) {
			console.error("Driver verification update failed", err);
			setError(err?.response?.data?.error || err.message || "Action failed");
		} finally {
			setActionId(null);
		}
	}

	return (
		<>
			<h2>Driver Verification</h2>
			<p style={{ marginTop: -12, marginBottom: 24, color: "var(--muted)" }}>
				Review identity submissions from transport drivers. Approvals
				automatically unlock driver access; rejections notify drivers to
				re-upload their CNIC and license details.
			</p>

			{error && (
				<div
					className="card"
					style={{ marginBottom: 16, color: "var(--danger)" }}
				>
					{error}
				</div>
			)}

			<div
				className="grid cols-3"
				style={{ marginBottom: 24 }}
			>
				<div className="card">
					<div className="small">Pending</div>
					<h3>{counts.pending ?? 0}</h3>
				</div>
				<div className="card">
					<div className="small">Approved</div>
					<h3>{counts.approved ?? 0}</h3>
				</div>
				<div className="card">
					<div className="small">Rejected</div>
					<h3>{counts.rejected ?? 0}</h3>
				</div>
			</div>

			<div
				className="card"
				style={{ marginBottom: 24 }}
			>
				<div
					className="grid cols-2"
					style={{ gap: 12 }}
				>
					<div>
						<label className="small">Status Filter</label>
						<select
							className="input"
							value={status}
							onChange={(e) => setStatus(e.target.value)}
						>
							{statusOptions.map((opt) => (
								<option
									value={opt.value}
									key={opt.value}
								>
									{opt.label}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="small">Search</label>
						<input
							className="input"
							placeholder="Name, CNIC or license no."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</div>
			</div>

			<div className="card table-wrapper">
				{loading ? (
					<div className="loading">Loading driver submissions...</div>
				) : filtered.length === 0 ? (
					<div style={{ padding: "16px", color: "var(--muted)" }}>
						No driver submissions found for this filter.
					</div>
				) : (
					<table className="table">
						<thead>
							<tr>
								<th>Driver</th>
								<th>CNIC</th>
								<th>License</th>
								<th>Submitted</th>
								<th>Status</th>
								{canDecide && <th style={{ width: 180 }}>Actions</th>}
							</tr>
						</thead>
						<tbody>
							{filtered.map((item) => (
								<tr key={item._id}>
									<td>
										<strong>{item.name}</strong>
										<div className="small">{item.driverId?.email || "—"}</div>
									</td>
									<td>{item.cnic || "—"}</td>
									<td>
										<div>{item.licenseNumber || "—"}</div>
										{item.licenseImageUrl && (
											<a
												href={item.licenseImageUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="small"
											>
												View File ↗
											</a>
										)}
									</td>
									<td>
										{item.createdAt
											? format(new Date(item.createdAt), "MMM d, yyyy p")
											: "—"}
										{item.reviewedAt && (
											<div className="small">
												Reviewed{" "}
												{format(new Date(item.reviewedAt), "MMM d, yyyy")}
											</div>
										)}
									</td>
									<td>
										<span className={`badge ${badgeClass(item.status)}`}>
											{item.status}
										</span>
										{item.rejectionReason && (
											<div
												className="small"
												style={{ color: "var(--danger)" }}
											>
												{item.rejectionReason}
											</div>
										)}
									</td>
									{canDecide && (
										<td>
											<div style={{ display: "flex", gap: 8 }}>
												<button
													className="btn"
													onClick={() => handleAction(item._id, "approve")}
													disabled={
														actionId === item._id || item.status !== "pending"
													}
												>
													{actionId === item._id ? "Saving…" : "Approve"}
												</button>
												<button
													className="btn ghost"
													onClick={() => handleAction(item._id, "reject")}
													disabled={
														actionId === item._id || item.status !== "pending"
													}
												>
													Reject
												</button>
											</div>
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{!canDecide && (
				<div
					className="card"
					style={{ marginTop: 24 }}
				>
					Only administrators can approve or reject driver applications.
					Analysts can review submissions and leave feedback comments directly
					with ops.
				</div>
			)}
		</>
	);
}

function badgeClass(status) {
	switch (status) {
		case "approved":
			return "success";
		case "rejected":
			return "danger";
		default:
			return "warning";
	}
}
