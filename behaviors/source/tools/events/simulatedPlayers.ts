import { type EntityDieAfterEvent, world } from "@minecraft/server";
import { SimulatedPlayer } from "@minecraft/server-gametest";

world.afterEvents.entityDie.subscribe((event: EntityDieAfterEvent) => {
	if (event.deadEntity instanceof SimulatedPlayer) {
		event.deadEntity.respawn();
	}
});
