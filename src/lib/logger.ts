import { type InspectColor, styleText } from "node:util";
import { env } from "./env";

// this logger is a simplified version of @sapphire/plugin-logger
// https://github.com/sapphiredev/plugins/tree/main/packages/logger

export class Logger {
	private padNumber(num: number) {
		return num.toString().padStart(2, "0");
	}

	private formatTimestamp() {
		const currentTime = new Date();
		// YYYY-MM-DD
		const date = `${currentTime.getFullYear()}-${this.padNumber(currentTime.getMonth() + 1)}-${this.padNumber(currentTime.getDate())}`;
		// HH:mm:ss
		const time = `${this.padNumber(currentTime.getHours())}-${this.padNumber(currentTime.getMinutes())}-${this.padNumber(currentTime.getSeconds())}`;
		// YYYY-MM-DD HH:mm:ss
		return `${date} ${time}`;
	}

	write(
		level: "debug" | "info" | "warn" | "error",
		color: InspectColor,
		...values: readonly unknown[]
	) {
		console[level](
			// timestamp - log level - message
			`${styleText(color, this.formatTimestamp())} - ${styleText(color, level.toUpperCase().padEnd(5, " "))} -`,
			...values,
		);
	}

	debug(...values: readonly unknown[]) {
		if (!env.DEBUG) return;
		this.write("debug", "magenta", ...values);
	}

	info(...values: readonly unknown[]) {
		this.write("info", "cyan", ...values);
	}

	warn(...values: readonly unknown[]) {
		this.write("warn", "yellow", ...values);
	}

	error(...values: readonly unknown[]) {
		this.write("error", "red", ...values);
	}
}
