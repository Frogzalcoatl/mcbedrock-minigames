import { world } from "@minecraft/server";
import { SimulatedPlayer } from "@minecraft/server-gametest";

world.afterEvents.entityDie.subscribe((event) => {
	if (event.deadEntity instanceof SimulatedPlayer) {
		event.deadEntity.respawn();
	}
});
