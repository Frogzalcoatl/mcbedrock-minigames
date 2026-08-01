// biome-ignore-all lint/suspicious/noConsole: intended logging

import { createWriteStream, promises } from "node:fs";
import { resolve as _resolve, join } from "node:path";
import { ZipArchive } from "archiver";

const MCPACK_FILENAME = "addon.mcpack";
const OUTPUT_DIRECTORY_NAME = "_temp_mcpack_directory";

const PROJECT_ROOT = _resolve(import.meta.dirname, "..");
const OUTPUT_DIRECTORY_PATH = join(PROJECT_ROOT, OUTPUT_DIRECTORY_NAME);

const SKIP_DIRECTORIES = [".vscode", "node_modules", "source", "tools", OUTPUT_DIRECTORY_NAME];
const SKIP_FILES = [
	"build-mcpack.cjs",
	"esbuild.cjs",
	"package.json",
	"pnpm-lock.yaml",
	"pnpm-workspace.yaml",
	"tsconfig.json",
	MCPACK_FILENAME,
];

async function copyDirectory(source, destination) {
	await promises.mkdir(destination, { recursive: true });
	for (const entry of await promises.readdir(source, { withFileTypes: true })) {
		const name = entry.name;
		const sourcePath = join(source, name);
		const destinationPath = join(destination, name);
		if (entry.isDirectory()) {
			if (SKIP_DIRECTORIES.includes(name)) continue;
			await copyDirectory(sourcePath, destinationPath);
		} else {
			if (SKIP_FILES.includes(name)) continue;
			await promises.copyFile(sourcePath, destinationPath);
		}
	}
}

async function createZip(sourceDir, outputFilePath) {
	return new Promise((resolve, reject) => {
		const output = createWriteStream(outputFilePath);
		const archive = new ZipArchive({ zlib: { level: 9 } });

		output.on("close", resolve);
		archive.on("error", reject);

		archive.pipe(output);
		archive.directory(sourceDir, false);
		archive.finalize();
	});
}

async function build() {
	try {
		await promises.rm(OUTPUT_DIRECTORY_PATH, { force: true, recursive: true }).catch(() => {});

		console.log(`Starting build in: ${PROJECT_ROOT}`);
		console.log("Cleaning up old output directory...");
		await promises.rm(OUTPUT_DIRECTORY_PATH, { force: true, recursive: true });

		console.log(`Creating temporary directory at: ${OUTPUT_DIRECTORY_PATH}`);
		await copyDirectory(PROJECT_ROOT, OUTPUT_DIRECTORY_PATH);
		console.log("Successfully copied files.");

		const zipFilePath = join(PROJECT_ROOT, MCPACK_FILENAME);
		console.log(`Zipping contents to ${MCPACK_FILENAME}...`);
		await createZip(OUTPUT_DIRECTORY_PATH, zipFilePath);
		console.log("Successfully created addon.mcpack.");

		console.log("Deleting temporary output directory...");
		await promises.rm(OUTPUT_DIRECTORY_PATH, { force: true, recursive: true });
		console.log("Cleanup complete.");

		console.log("\nBuild finished successfully!");
	} catch (error) {
		console.error("\nAn error occurred during the build process:");
		console.error(error);
		process.exit(1);
	}
}

build();
