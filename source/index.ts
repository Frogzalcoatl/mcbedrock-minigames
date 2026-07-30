import { world } from "@minecraft/server";

world.afterEvents.playerSpawn.subscribe((event) => {
	if (event.initialSpawn) {
		event.player.sendMessage("Hello World!");
	}
});
