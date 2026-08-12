# Minigames

A collection of minecraft minigames that can be played concurrently.
Each minigame instance is split into its own custom dimension.

## Games
We plan to include established games from popular servers such as Kit Pvp, Skywars, and The Bridge. We will brainstorm unique game ideas later on.
I'll start a list of games im interested in adding below.

- Kit Pvp
- The Bridge
- Parkour
- Skywars
- Bedwars
- Build Battle

## Custom Commands
**Operators Only:**

`/load` - Load structure from minigame behavior pack.

`/settings` - Manage active rooms.

`/newsave` - Place structure blocks for save based on bounds.

`/existingsave` - Place structure blocks for save based on existing structure.

`/sim` - Spawn simulated players.

`/clearsim` - Clear simulated players.

**All Players:**

`/hub` - Transfer to hub.

`/profile` - View a player profile.

`/queue` - Join a game queue.

## Structure Loading
This project solely uses structure files to improve ease of collaboration.
Since we're not relying on a single world file, this project can be contributed to easily from any device.
Structures built by contributors should be exported to .mcstructure files using structure blocks in game.

**Exporting New Structures:**

* Export your structure and save it to: `structures/mg/`.
* Then add a matching identifier to structureIds in: `source/structures/data.ts`.
* If a structure cannot fit in one file, export multiple and store offsets in a json file: `source/structures/json/`.
	* See type **StructureSchema** in data.ts for formatting.
	* Make sure to import your json file to data.ts, add an identifier to structureIds, then add a matching case to the switch statement in getStructureInfo().

## Rooms
Each room has its own custom dimension. Custom dimensions can only be registered on startup and cannot be cleared on world reload.
Rooms optionally include a hub, which can also be used for waiting rooms.
Use the **/settings** command to manage rooms in game.

## Tools
**Implemented:**
- Kill Tracker
	- Uses the EntityHurtAfterEvent to recognize undirect kills, such as knocking a player into the void.
	- CooldownTicks represents the max amount of time that a kill will still be counted after last hit.
	- An optional per room onKill callback can be included, which is useful for death messages.
	- An optional per room showCombatTime callback can be included as well.

- Projectile Tracker
	- Can be used to kill projectiles shot by a player on leave.

**Planned:**
- Something to manage teams for a game like bedwars
- Custom fall damage?
- Custom knockback?

## Custom Items
The extent of custom items on this world are currently just renamed vanilla items.
As far as I know, theres no feasible way to prevent players from renaming their items to match the type/name of one of my custom items.
I would like to learn about adding custom items through resource packs in the future, just in case we decide to give players anvil access in a future gamemode.

## Kits
A collection of items with optional onKill and onDeath callbacks. Currently just used for kitpvp, but can be used for future modes like The Bridge.