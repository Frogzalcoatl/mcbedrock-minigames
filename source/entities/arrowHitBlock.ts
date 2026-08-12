import { world } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";

world.afterEvents.projectileHitBlock.subscribe((event) => {
	if (event.projectile.isValid && event.projectile.typeId === MinecraftEntityTypes.Arrow) {
		event.projectile.remove();
	}
});
