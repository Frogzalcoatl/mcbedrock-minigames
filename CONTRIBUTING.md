# Contributing
This project uses [sunshinekitsune's scripting template](https://github.com/sunshinekitsune/mcbedrock-gametest-starter) for Minecraft: Bedrock Edition, slightly modified to include a resource pack.

## Features
* Typescript configured for ES2023.
* Proper bundling with Esbuild for vanilla-data and third-party packages.
* Strict linting with Biome.
* Development environment configured with extensions.
* Minification and js.map.
* Automated mcaddon building.

## Requirements
You need the following utilities installed: [pnpm](https://pnpm.io/), [node LTS](https://nodejs.org/en/download), [vscode](https://code.visualstudio.com/)

## Setup
1. Clone the repository.

	Open a terminal in that directory and clone this repository.
	```sh
	git clone https://github.com/Frogzalcoatl/mcbedrock-minigames.git
	cd mcbedrock-minigames
	```

2. Install dependencies.

	Install the required Node packages.
	```sh
	pnpm install
	```

3. Link this project to the com.mojang folder.

	Open `symlinks.bat` and enter "y" to create symlinks in the com.mojang folder.

4. Open your IDE.

	After installing the packages, open the folder in VSCode.
	* If you have already opened VSCode, restart so Biome can initialize properly.

5. Install recommended packages.

	In the bottom right of VSCode, it should ask you to install some extensions. Click yes!

6. Done! You are ready.

## Commands
- ``pnpm run watch`` Cleans the output directory and automatically recompiles scripts when files are modified. Use this while developing.
- ``pnpm run build`` Performs a single production build.
- ``pnpm run pack`` Builds code and packs all necessary files into a addon.mcaddon.
- ``pnpm run clean`` Removes temporary files.

# Post-setup instructions.
If you want to compress your code for mcaddon builds, set minify: true in tools/esbuild.cjs.
