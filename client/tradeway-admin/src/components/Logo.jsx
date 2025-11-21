import React from "react";
import logoImage from "../assets/tradeway_logo.png";

export default function Logo() {
	return (
		<div
			className="logo-container"
			style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
		>
			<img
				src={logoImage}
				alt="TradeWay Logo"
				className="logo-img"
				width="80"
				height="80"
			/>
			<span
				className="logo-text"
				style={{ marginTop: "8px" }}
			>
				TradeWay
			</span>
		</div>
	);
}
