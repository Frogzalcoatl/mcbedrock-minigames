import { GameMode, world } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";

// Currently no games that need block interaction enabled.
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	if (event.player.getGameMode() !== GameMode.Creative) {
		event.cancel = true;
	}
});

world.afterEvents.projectileHitBlock.subscribe((event) => {
	if (event.projectile.isValid && event.projectile.typeId === MinecraftEntityTypes.Arrow) {
		event.projectile.remove();
	}
});
