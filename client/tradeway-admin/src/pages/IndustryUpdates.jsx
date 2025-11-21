import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function IndustryUpdates() {
	const { user } = useAuth();
	const [items, setItems] = useState([]);
	const [form, setForm] = useState({
		title: "",
		summary: "",
		source: "",
		link: "",
		tags: "",
		published: true,
		publishedAt: "",
	});
	const [deleteModal, setDeleteModal] = useState({
		show: false,
		id: null,
		title: "",
	});
	const canPost = ["admin", "analyst"].includes(user?.role);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	async function load() {
		try {
			setLoading(true);
			setError(null);
			const { data } = await api.get("/api/industry/updates");
			setItems(Array.isArray(data?.items) ? data.items : []);
		} catch (err) {
			setError(err.message || "Failed to load updates");
			console.error("Failed to load industry updates:", err);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	const confirmDelete = (id, title, e) => {
		e?.preventDefault();
		if (!canPost) {
			setError("You don't have permission to delete updates");
			return;
		}
		if (!id) {
			setError("Cannot delete: Update ID is missing");
			return;
		}
		setDeleteModal({ show: true, id, title });
	};

	const handleDelete = async () => {
		const { id } = deleteModal;
		try {
			setLoading(true);
			setError(null);
			await api.delete(`/api/industry/updates/${id}`);
			await load();
			setDeleteModal({ show: false, id: null, title: "" });
		} catch (err) {
			setError(err.message || "Failed to delete update");
			console.error("Failed to delete industry update:", err);
		} finally {
			setLoading(false);
		}
	};

	const cancelDelete = () => {
		setDeleteModal({ show: false, id: null, title: "" });
	};

	const submit = async (e) => {
		e.preventDefault();
		if (!canPost) return;
		try {
			setLoading(true);
			const payload = {
				...form,
				tags: form.tags ? form.tags.split(",").map((s) => s.trim()) : [],
			};
			if (!payload.publishedAt) {
				payload.publishedAt = new Date().toISOString();
			}
			await api.post("/api/industry/updates", payload);
			setForm({
				title: "",
				summary: "",
				source: "",
				link: "",
				tags: "",
				published: true,
				publishedAt: "",
			});
			await load();
		} catch (err) {
			setError(err.message || "Failed to create update");
			console.error("Failed to create industry update:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<h2>Industry Updates</h2>

			{error && (
				<div
					className="card error"
					style={{ marginBottom: 16, color: "var(--danger)" }}
				>
					{error}
				</div>
			)}

			{canPost && (
				<div
					className="card"
					style={{ marginBottom: 16 }}
				>
					<form onSubmit={submit}>
						<div className="grid cols-2">
							<div className="form-row">
								<label>Title</label>
								<input
									className="input"
									value={form.title}
									onChange={(e) =>
										setForm((f) => ({ ...f, title: e.target.value }))
									}
								/>
							</div>
							<div className="form-row">
								<label>Source</label>
								<input
									className="input"
									value={form.source}
									onChange={(e) =>
										setForm((f) => ({ ...f, source: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className="form-row">
							<label>Summary</label>
							<textarea
								className="input"
								rows="3"
								value={form.summary}
								onChange={(e) =>
									setForm((f) => ({ ...f, summary: e.target.value }))
								}
							/>
						</div>
						<div className="grid cols-2">
							<div className="form-row">
								<label>Link</label>
								<input
									className="input"
									value={form.link}
									onChange={(e) =>
										setForm((f) => ({ ...f, link: e.target.value }))
									}
								/>
							</div>
							<div className="form-row">
								<label>Tags (comma-separated)</label>
								<input
									className="input"
									value={form.tags}
									onChange={(e) =>
										setForm((f) => ({ ...f, tags: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className="grid cols-2">
							<div className="form-row">
								<label>Published</label>
								<select
									className="input"
									value={form.published}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											published: e.target.value === "true",
										}))
									}
								>
									<option value="true">true</option>
									<option value="false">false</option>
								</select>
							</div>
							<div className="form-row">
								<label>
									Published At (optional ISO; leave blank to default)
								</label>
								<input
									className="input"
									placeholder="2025-10-07T05:00:00.000Z"
									value={form.publishedAt}
									onChange={(e) =>
										setForm((f) => ({ ...f, publishedAt: e.target.value }))
									}
								/>
							</div>
						</div>
						<button
							className="btn"
							type="submit"
							disabled={loading}
						>
							{loading ? "Saving..." : "Create Update"}
						</button>
					</form>
				</div>
			)}

			<div className="grid">
				{loading && items.length === 0 && (
					<div className="card">Loading industry updates...</div>
				)}
				{!loading && items.length === 0 && (
					<div className="card">No industry updates found.</div>
				)}
				{items.map((u, i) => (
					<div
						key={u._id || i}
						className="card"
						style={{
							opacity: u.published ? 1 : 0.7,
							border: u.published ? undefined : "1px dashed var(--border)",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "start",
							}}
						>
							<div>
								<strong>{u.title}</strong>
								<div className="small">
									{u.source} •{" "}
									{new Date(u.createdAt || u.publishedAt).toLocaleString()}
								</div>
							</div>
							<div
								style={{ display: "flex", gap: "8px", alignItems: "center" }}
							>
								<span className={`badge ${u.published ? "primary" : ""}`}>
									{u.published ? "Published" : "Draft"}
								</span>
								{canPost && (
									<button
										className="btn small danger"
										onClick={(e) => confirmDelete(u._id, u.title, e)}
										disabled={loading}
										style={{ padding: "4px 8px" }}
									>
										Delete
									</button>
								)}
							</div>
						</div>
						<p>{u.summary}</p>
						{u.tags?.length > 0 && (
							<div className="tags">
								{u.tags.map((tag, i) => (
									<span
										key={i}
										className="badge"
									>
										{tag}
									</span>
								))}
							</div>
						)}
						{u.link && (
							<a
								href={u.link}
								target="_blank"
								rel="noopener noreferrer"
								className="small"
							>
								Read more →
							</a>
						)}
					</div>
				))}
			</div>

			{/* Delete Confirmation Modal */}
			{deleteModal.show && (
				<div
					className="modal-overlay"
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1000,
					}}
				>
					<div
						className="modal card"
						style={{
							backgroundColor: "#ffffff",
							color: "#333",
							borderRadius: "var(--radius, 8px)",
							border: "1px solid rgba(0, 0, 0, 0.1)",
							padding: "24px",
							maxWidth: "400px",
							width: "90%",
							boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
						}}
					>
						<h3 style={{ margin: "0 0 16px 0" }}>Delete Industry Update?</h3>
						<p style={{ margin: "0 0 16px 0" }}>
							Are you sure you want to delete this industry update?
						</p>
						<p style={{ margin: "0 0 16px 0" }}>
							<strong>Title:</strong> {deleteModal.title}
						</p>
						<p
							style={{
								margin: "0 0 24px 0",
								color: "#ff4444",
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<span>⚠</span> This action cannot be undone.
						</p>
						<div
							style={{
								margin: "0 -24px",
								height: "1px",
								backgroundColor: "rgba(0, 0, 0, 0.1)",
							}}
						/>
						<div
							style={{
								display: "flex",
								gap: "8px",
								justifyContent: "flex-end",
								marginTop: "24px",
							}}
						>
							<button
								onClick={cancelDelete}
								disabled={loading}
								style={{
									padding: "8px 16px",
									background: "none",
									border: "1px solid rgba(0, 0, 0, 0.1)",
									borderRadius: "4px",
									color: "#333",
									cursor: "pointer",
								}}
							>
								Cancel
							</button>
							<button
								onClick={handleDelete}
								disabled={loading}
								style={{
									padding: "8px 16px",
									backgroundColor: "#ff4444",
									border: "none",
									borderRadius: "4px",
									color: "#fff",
									cursor: "pointer",
								}}
							>
								{loading ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
