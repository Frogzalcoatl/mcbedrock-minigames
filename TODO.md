# TODO
The current system for managing rooms and gamemodes is in need of major refactoring before continuing this project. I will start by listing what rooms and games should be responsible for respectively.

### Rooms
* One per dimension
* Players do not need to be manually tracked, use dimension.getPlayers()
* Optional local hub that overrides /hub command if player is not in said local hub
* On join, player spawnpoint is set to spawn of room or spawn of local hub if applicable

### Games
* Each
