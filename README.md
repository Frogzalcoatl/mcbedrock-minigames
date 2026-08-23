# Minigames

A collection of Minecraft Bedrock Edition minigames that can be played concurrently.
Each minigame instance is split into its own custom dimension.

## Games
We plan to include established games from popular servers such as Kit Pvp, Skywars, and The Bridge.
We will brainstorm unique game ideas in the future.
I'll start a list of games I'm interested in adding below.

- Kit Pvp
- The Bridge
- Parkour
- Skywars
- Bedwars
- Build Battle

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

## Structure Loading
This project solely uses structure files to improve ease of collaboration.
Since we're not relying on any world files, this project can be contributed to easily from any device.
Structures built by contributors should be exported to .mcstructure files using structure blocks in game.
Each structure has a maximum size of: (x = 64 Blocks, y = 384 Blocks, z = 64 Blocks).
If your structure exceeds this size, this pack can map multiple structure files to a single in game structure id.

**One file needed:**
1. Export your structure and save it to: `structures/mg/`.
2. Copy the relative file path using forward slashes to the structureIds array in: `source/structures/data.ts`.

**Multiple files needed:**
1. Export your structures and save them to: `structures/mg/`.
2. Store position offsets of each structure file in a json file: `source/structures/json/`.
	* See type [StructureSchema](https://github.com/Frogzalcoatl/mcbedrock-minigames/blob/main/source/structures/data.ts) for formatting in: `source/structures/data.ts`.
	* structureId should be a file path relative to `structures/mg/`, ignoring the .mcstructure file extension.
3. Import your json file in data.ts, then add it to the structureSchemas map.

**Loading structures in game:**

Use the /load command. Example:
```
/load "frogzalcoatl/lobby/minersRealm"
```
Loads structure with id "frogzalcoatl/lobby/minersRealm" at the user's current position.

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
	- An optional per room showCombatTime callback can be included to display a cooldown countdown.

- Projectile Tracker
	- Can be used to kill projectiles shot by a player on leave.

**Planned:**
- Something to manage teams for a game like bedwars
- Custom fall damage?
- Custom knockback?

## Custom Items
Custom items on this world are currently just renamed vanilla items.
I would like to learn about adding custom items through resource packs in the future, just in case we decide to give players anvil access in a future gamemode.
As far as I know, theres no feasible way to prevent players from renaming their items to match the type/name of one of my custom items.

## Kits
A collection of items with optional onKill and onDeath callbacks. Currently just used for kitpvp, but can be used for future modes like The Bridge.