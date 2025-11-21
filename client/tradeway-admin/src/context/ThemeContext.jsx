import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [isDark, setIsDark] = useState(() => {
		const saved = localStorage.getItem("theme");
		return saved ? saved === "dark" : true; // default to dark theme
	});

	useEffect(() => {
		localStorage.setItem("theme", isDark ? "dark" : "light");
		document.documentElement.setAttribute(
			"data-theme",
			isDark ? "dark" : "light"
		);
	}, [isDark]);

	const toggleTheme = () => setIsDark(!isDark);

	return (
		<ThemeContext.Provider value={{ isDark, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
