# TODO
## Old
* Add duels and the tools necessary to recreate similar gamemodes

* Should you be using game.state setters inside game class like that?

* Fix errors that occur when you queue two simulated players in duels and run clearsim
	* Additionally handle ties properly

* Fix spectator teleport location when joining while game is active

## New
The current system for managing rooms and gamemodes is in need of major refactoring before continuing this project. I will start by listing what rooms and games should be responsible for respectively.

### Rooms
* One per dimension
* Players do not need to be manually tracked, use dimension.getPlayers()
* Optional local hub that overrides /hub command if player is not in said local hub
* Player spawnpoint = spawn of current room or local hub

### Games
* Serves as a team manager, including an array of teams
* Relevant EventSignals (onStart, whilActive, onElimination)
	* Is whileActive necessary? The main use cases for whileActive i can think of are item generators, but those should probably be managed separately anyways.
	* Probably some sort of per game context should exist
* Should be the class containing kill/projectile trackers not dimensionIds/rooms

Rooms should be reusable for any game mode. 
