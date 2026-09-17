import { GameMode, world } from "@minecraft/server";

// Currently no games that need block interaction. Will come back to this.
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	if (event.player.getGameMode() !== GameMode.Creative) {
		event.cancel = true;
	}
});
