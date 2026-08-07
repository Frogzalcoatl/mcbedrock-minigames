# Minigames

A collection of minecraft minigames that can be played concurrently.
Each minigame instance is split into its own custom dimension.

## Custom Commands
**Operators Only:**

`/load` - Load structures stored in the behavior pack

`/savenew` - Automatically place spaced out structure blocks to cover a range of blocks for export

`/saveold` - Place structure blocks in positions needed for an existing structure

`/room` - Room management

**All Players:**

`/hub` - Teleport to hub

`/queue` - Queue for different gametypes

`/profile` - View profiles of online players

## Structure Loading
Structures built by contributors can be exported to mcstructure files and reloaded in any world.
If a structure cannot fit in one file, save multiple and store offsets in a json file **source/structures/json/**.
Make sure to import json files in **source/structures/data.ts**. Add a matching id to the array to be referenced in structure load functions and add a case to the switch statement.

Offsets are stored as type: `[string, number, number, number][]` (`[structureId, relX, relY, relZ][]`)

## Rooms
Each room has its own custom dimension. Custom dimensions can only be registered on startup, and cannot be cleared on world reload. The room class also contains optional modules that can be enabled in the constructor such as custom death messages. I'll list modules below:

**Implemented:**
- Block Interaction Manager
	- Just stores a callback for the PlayerInteractWithBlockBeforeEvent and PlayerInteractWithBlockAfterEvent.

- Death Message Manager
	- Sends string formatted by callback to players in room.

- Projectile Tracker
	- Currently being used to kill loyalty tridents in kit pvp when a player leaves, but can be applied for any projectile types.

**Planned:**
- Something to manage teams for a game like bedwars

## Room Types
Create any number of room instances with the same properties and modules (The dimension id and displayName will have a number appended).

## Games
We plan to mainly include games inspired by popular servers such as Kit Pvp, Skywars, and The Bridge. Perhaps we can come up with some new ideas later on as well. I'll start a list of games im interested in adding below. Just because they are here does not guarantee we'll actually add them.

- Kit Pvp
- The Bridge
- Skywars
- Bedwars
- Build Battle
- Parkour