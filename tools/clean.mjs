import { rmSync } from "node:fs";

const FILES_TO_CLEAN = ["./scripts", "./_temp_mcpack_directory", "./addon.mcpack"];

for (const path of FILES_TO_CLEAN) {
	rmSync(path, {
		force: true,
		maxRetries: process.platform === "win32" ? 10 : 0,
		recursive: true,
	});
}
