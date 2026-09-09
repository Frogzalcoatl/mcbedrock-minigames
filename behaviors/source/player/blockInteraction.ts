import { GameMode, world } from "@minecraft/server";

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	if (event.player.getGameMode() !== GameMode.Creative) {
		event.cancel = true;
	}
});
