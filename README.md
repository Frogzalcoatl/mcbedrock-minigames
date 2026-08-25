# Minigames

A collection of Minecraft Bedrock Edition minigames that can be played concurrently.
Each minigame instance is split into its own custom dimension.

## Games
We plan to include established games from popular servers such as Kit Pvp, Skywars, and The Bridge.
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
This project solely uses structure files to improve ease of collaboration.
Since we're not relying on any world files, this project can be contributed to easily from any device.

### Exporting Structures
Structures built by contributors should be exported to .mcstructure files using structure blocks in game.

1. To get a structure block, run the following command:

```
/give @s structure_block
```

2. Once you place it and enter its UI, type anything into the Structure Name field.
	- The name itself is not important, but is required to enable the export button.

3. Adjust your size and offset.
	- Do not include structure blocks within the bounds of your export. (Use offset)
	- Each structure has a maximum size of: (x = 64 Blocks, y = world height, z = 64 Blocks).

4. Click export and save the .mcstructure file(s) to `behaviors/structures/mg/yourUsernameHere/`.
	- If your structure exceeds the max size, this pack can map multiple structure files to a single in game structure id.
	- I suggest you create a folder with your intended structure name, then export each file as 1.mcstructure, 2.mcstructure, etc.

### Managing Structure Files
**One file needed:**

1. Determine your structure's file path relative to `behaviors/structures/mg/` (Example: "ghostly/crates").

2. Add that value to the structureIds array in: `behaviors/source/structures/data.ts`.

**Multiple files needed:**

1. Store position offsets of each structure file in a json file: `behaviors/source/structures/json/`.
	- When choosing your json file location, try to match the file structure in `behaviors/structures/mg/` for consistency.
	- See type [StructureSchema](https://github.com/Frogzalcoatl/mcbedrock-minigames/blob/main/behaviors/source/structures/data.ts) for formatting in: `behaviors/source/structures/data.ts`.
	- structureId should be a file path relative to `behaviors/structures/mg/`, ignoring the .mcstructure file extension.

2. Import your json file in data.ts. Example Import:
```ts
import usernameMyStructure from "./json/username/myStructure" with { type: "json" };
```

3. Add your structure to the structureSchemas map. The key (left value) represents its in game id. I prefer to set it to the structure's relative file path for consistency. Example:
```ts
import usernameMyStructure from "./json/username/myStructure" with { type: "json" };

const structureSchemas = new Map<string, unknown>([
	// ...
	["username/myStructure", usernameMyStructure],
]);
```


### Loading Structures

Use the **/load** command. Example:
```
/load "frogzalcoatl/lobby/minersRealm"
```
Loads structure with id "frogzalcoatl/lobby/minersRealm" at the user's current position.

## Custom Commands
**Operators Only:**

`/load` - Load structure from behavior pack.

`/settings` - Manage active rooms.

`/newsave` - Place structure blocks for save based on bounds.

`/existingsave` - Place structure blocks for save based on existing structure.

`/sim` - Spawn simulated players.

`/clearsim` - Clear simulated players.

**All Players:**

`/hub` - Transfer to hub.

`/profile` - View a player profile.

`/q` - Join a game queue.

## Rooms
Each room has its own custom dimension. Custom dimensions can only be registered on startup and cannot be reset once registered.
Even if a world is loaded without registering a specific dimension, its data still exists and will remain if registered again.
Rooms optionally include a hub, which can also be used for waiting rooms.
Use the **/settings** command to manage rooms in game.

## Tools
**Implemented:**
- Kill Tracker
	- Grants indirect kills by tracking who last attacked an entity using the EntityHurtAfterEvent.
	- Cooldown ticks represents the max amount of time that a kill will still be counted after last hit.
	- An optional per room onKill callback can be included, which is useful for death messages.
	- An optional per room showCombatTime callback can be included to display a cooldown countdown. (e.g. an actionbar)

- Projectile Tracker
	- Can be used to kill projectiles shot by a player on leave.
	- Projectiles cannot be removed on world shutdown, so they are all tagged then removed on entityLoad.

**Planned:**
- Custom Knockback
	- Minecraft gamerule pvp set to false.
	- Use events to manually calculate damage and knockback.
	- Useful to enable/disable combat based on gamemode.
	- Try to emulate The Hive here.

- Team Manager
	- Would use custom kockback listed above to cancel attacks from teammates.

- Custom Fall Damage
	- Useful to enable, disable, or edit fall damage based on gamemode.

- Game States
	- GameStarting, GameActive, GameResetting, etc.
	- Not sure how I want to implement these yet but definitely needed.

- Player Statistics
	- Kills, Wins, etc.
	- Use dynamic properties (per stat properties instead of the json stringify tomfoolery I did before)

- Game Queuing
	- For modes that should have more than one instance such as duels.
	- I don't think we'd ever have enough players for skill based matchmaking, so just fill rooms in order.

## Floating Text
A basic invisible entity whose nametag is always visible. 

**Spawning:**

Rename the default mg:text spawn egg with an anvil and place it down. 

Or you can instead run:
```
/summon mg:text "your text here" ~ ~ ~
```

**Removing:**

Remove all text entities within 1 block of the user:
```
/kill @e[r=1,type=mg:text]
```
If you need more precision than 1 block, change the number after r= (Example: r=0.5).

## Custom Items
Custom items on this world are currently just renamed vanilla items.
I would like to learn about adding custom items through resource packs in the future, especially if we decide to give players anvil access in a future gamemode.
As far as I know, theres no feasible way to prevent players from renaming their items to match the type/name of one of my custom items.

## Kits
A collection of items with optional onKill and onDeath callbacks. Currently just used for kitpvp, but can be used for future modes like The Bridge.