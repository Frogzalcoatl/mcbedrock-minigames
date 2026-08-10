# Minigames

A collection of minecraft minigames that can be played concurrently.
Each minigame instance is split into its own custom dimension.

## Games
We plan to include established games from popular servers such as Kit Pvp, Skywars, and The Bridge. We will brainstorm unique game ideas later on. I'll start a list of games im interested in adding below. Just because they're listed does not guarantee we'll actually add them.

- Kit Pvp
- The Bridge
- Skywars
- Bedwars
- Build Battle
- Parkour

## Custom Commands
**Operators Only:**

`/load` - Load structure from minigame behavior pack.

`/room` - Manage active rooms.

`/savenew` - Place structure blocks for save based on bounds.

`/saveold` - Place structure blocks for save based on existing structure.

`/sim` - Spawn simulated players.

`/clearsim` - Clear simulated players.

**All Players:**

`/hub` - Transfer to hub.

`/profile` - View a player profile.

`/queue` - Join a game queue.

## Structure Loading
This project relies on structure files to improve ease of collaboration.
Structures built by contributors can be exported to mcstructure files and reloaded in any world.
Since we're not relying on a single world file, this project can be contributed to easily from any device.

**Exporting New Structures:**

* Export your structure and save it to: ``structures/mg/``.
* Then add a matching identifier to structureIds in: ``source/structures/data.ts``.
* If a structure cannot fit in one file, export multiple and store offsets in a json file: ``source/structures/json/``.
	* See type StructureSchema in data.ts for formatting.
	* Make sure to import your json file to data.ts, add an identifier to structureIds, then add a matching case to the switch statement in getStructureInfo().

## Rooms
Each room has its own custom dimension. Custom dimensions can only be registered on startup, and cannot be cleared on world reload. The room class also contains optional modules that can be enabled in the Room constructor. I'll list modules below:

**Implemented:**
- Block Interaction Manager
	- Simply stores a callback for the PlayerInteractWithBlockBeforeEvent and PlayerInteractWithBlockAfterEvent.

- Kill Tracker
	- Uses the EntityHurtAfterEvent to recognize undirect kills, such as knocking a player into the void.
	- CooldownTicks represents the max amount of time that a kill will still be counted after last hit.
	- An optional onKill callback can be included, which is useful for death messages.
	- If includeMobs is set to true, killing mobs will trigger the onKill callback.

- Projectile Tracker
	- Can be used to kill projectiles shot by a player on leave.

**Planned:**
- Something to manage teams for a game like bedwars
- Custom fall damage?
- Custom knockback?