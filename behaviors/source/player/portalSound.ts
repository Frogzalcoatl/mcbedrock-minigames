import { type PlayerDimensionChangeAfterEvent, world } from "@minecraft/server";

world.afterEvents.playerDimensionChange.subscribe((event: PlayerDimensionChangeAfterEvent) => {
	event.player.stopSound("portal.travel");
});
