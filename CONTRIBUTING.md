# Contributing
This project uses [sunshinekitsune's scripting template](https://github.com/new?template_name=mcbedrock-gametest-starter&template_owner=sunshinekitsune) for Minecraft: Bedrock Edition.

## Features
* Typescript configured for ES2023.
* Proper bundling with Esbuild for vanilla-data and third-party packages.
* Strict linting with Biome.
* Development environment configured with extensions.
* Minification and js.map.
* Automated mcpack building.

## Requirements
You need the following utilities installed: [pnpm](https://pnpm.io/), [node LTS](https://nodejs.org/en/download), [vscode](https://code.visualstudio.com/)

## Setup
1. Locate your Minecraft development behavior packs directory.

	Press ``Windows + R`` and paste the appropriate directory path for your Minecraft version into File Explorer.
	* Minecraft Bedrock ``%appdata%\Minecraft Bedrock\users\shared\games\com.mojang\development_behavior_packs``
	* Minecraft Preview ``%appdata%\Minecraft Bedrock Preview\users\shared\games\com.mojang\development_behavior_packs``

2. Clone the repository.

	Open a terminal in that directory and clone this repository.
	```sh
	git clone https://github.com/Frogzalcoatl/mcbedrock-minigames.git
	cd mcbedrock-minigames
	```

3. Install dependencies.

	Install the required Node packages.
	```sh
	pnpm install
	```

4. Open your IDE.

	After installing the packages, open the folder in VSCode.
	* If you have already opened VSCode, restart so Biome can initialize properly.

5. Install recommended packages.

	In the bottom right of VSCode, it should ask you to install some extensions. Click yes!

6. Done! You are ready.

## Commands
- ``pnpm run watch`` Cleans the output directory and automatically recompiles scripts when files are modified. Use this while developing.
- ``pnpm run build`` Performs a single production build.
- ``pnpm run pack`` Builds code and packs all necessary files into a addon.mcpack.
- ``pnpm run clean`` Remotes temporary files.

# Post-setup instructions.
If you want to compress your code for mcpack builds, set minify: true in tools/esbuild.cjs.

## Beta API
This project is set up to use the stable version of gametest scripting modules. If you want to switch to beta, update both the version in package.json AND manifest.json.
