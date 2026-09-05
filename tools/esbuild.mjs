// biome-ignore-all lint/suspicious/noConsole: intended logging

import { execSync } from "node:child_process";
import { context } from "esbuild";

const args = process.argv.slice(2);
const isWatch = args.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const options = {
	bundle: true,
	entryPoints: ["./behaviors/source/index.ts"],
	external: [
		"@minecraft/server",
		"@minecraft/server-ui",
		"@minecraft/server-admin",
		"@minecraft/server-gametest",
		"@minecraft/server-net",
	],
	format: "esm",
	keepNames: true,
	logLevel: "info",
	minify: false,
	outfile: "behaviors/scripts/main.esm.js",
	platform: "neutral",
	sourcemap: false,
	sourcesContent: false,
	target: "es2021",
};

const ctx = await context(options);
if (isWatch) {
	await ctx.watch();
	console.log(`Watching to outfile: ${options.outfile}`);
} else {
	await ctx.rebuild();
	await ctx.dispose();
	console.log(`Built outfile: ${options.outfile}`);
}
