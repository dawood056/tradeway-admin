import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Logo from "./Logo";
import "./Navbar.css";

export default function Navbar() {
	const { user, logout } = useAuth();
	const { isDark, toggleTheme } = useTheme();
	return (
		<div className="navbar">
			<div className="navbar-brand">
				{/* <Logo /> */}
				<span className="badge primary">Analytics</span>
			</div>
			<div className="navbar-user">
				<button
					className="btn icon"
					onClick={toggleTheme}
					style={{
						padding: "8px",
						marginRight: "8px",
					}}
					title={isDark ? "Switch to light mode" : "Switch to dark mode"}
				>
					{isDark ? "🌞" : "🌙"}
				</button>
				<span className="user-info">
					{user?.fullName} • {user?.role}
				</span>
				<button
					className="btn ghost"
					onClick={logout}
				>
					Logout
				</button>
			</div>
		</div>
	);
}
