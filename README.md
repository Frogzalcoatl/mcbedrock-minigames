# Minigames
A collection of Minecraft Bedrock Edition minigames that can be played concurrently.
Each minigame instance is split into its own custom dimension.

## Games
Will include established games from popular servers such as Kit Pvp, Skywars, and The Bridge.
We will brainstorm unique game ideas in the future.
I'll start a list of games I'm interested in adding below.

- Kit Pvp
- Duels
- The Bridge
- Parkour
- Skywars
- Bedwars
- Build Battle

## Structure Loading
This project does not rely on a world file.
We solely use structure files to improve ease of collaboration.

### Exporting Structures
Structures built by contributors should be exported to .mcstructure files using structure blocks in game.

1. To get a structure block, run the following command in game:

```
/give @s structure_block
```

2. Place it and enter its UI, then type anything into the Structure Name field.
	- The name itself is not important, but is required to enable the export button.

3. Adjust the size and offset.
	- Do not include structure blocks within the structure's bounds. (Use offset)
	- Each structure has a maximum size of: (x = 64 Blocks, y = world height, z = 64 Blocks).

4. Click export and save the .mcstructure file(s) to `behaviors/structures/mg/yourUsernameHere/`.
	- If a structure exceeds the max size, this pack can map multiple structure files to a single in game structure id.
	- Create a folder with your intended structure name, then export each file as 1.mcstructure, 2.mcstructure, etc.

### Managing Structure Files
**One file needed:**

1. Determine the structure file's path relative to `behaviors/structures/mg/` (Example: "ghostly/crates").

2. Add that value to the addIds array in: `behaviors/source/structures/index.ts`.

**Multiple files needed:**

1. Store position offsets of each structure file in a json file at: `behaviors/source/structures/json/`. The json file should contain an array of: `["structureId", relativeX, relativeY, relativeZ]`
	
- When choosing a json file location, try to match the file structure in `behaviors/structures/mg/` for consistency.
- structureId should be a file path relative to `behaviors/structures/mg/`, ignoring the .mcstructure file extension.

Example:
```json
[
	["username/structurePath1", 0, 0, 0],
	["username/structurePath2", 64, 0, 0]
]
```

2. Import the json file in structures/index.ts. Example Import:
```ts
import usernameMyStructure from "./json/username/myStructure" with { type: "json" };
```

3. Add your structure to the addSchemas map. The key (left value) represents its in game id. Please set this to the structure's relative file path for consistency. Example:
```ts
import usernameMyStructure from "./json/username/myStructure" with { type: "json" };

tools.structures.addSchemas([
	// ...
	["username/myStructure", usernameMyStructure],
]);
```

### Loading Structures
Use the **/load** command. Example:
```
/load "username/myStructure"
```
Loads structure with id "username/myStructure" at the user's current position.

## Features
I am in the process of refactoring this pack's features. Will update this once done.
