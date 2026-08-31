import { type Dimension, type Entity, type Vector3, world } from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { spreadParticles } from "../particles/spread";
import { ICE_BOMB_ID } from "../constants";

function run(dimension: Dimension, at: Vector3, source: Entity | undefined): void {
	const hitEntities: Entity[] = dimension.getEntities({ location: at, maxDistance: 5 });
	for (const entity of hitEntities) {
		if (source !== undefined && source.id === entity.id) {
			continue;
		}
		entity.addEffect(MinecraftEffectTypes.Slowness, 20 * 10, { amplifier: 1 });
		entity.addEffect(MinecraftEffectTypes.Blindness, 20 * 3);
	}
	spreadParticles("minecraft:snowflake_particle", dimension, at, 2.5, 2, 100);
	dimension.playSound("breeze_wind_charge.burst", at);
}

world.afterEvents.projectileHitBlock.subscribe((event) => {
	if (event.projectile.typeId === ICE_BOMB_ID) {
		run(event.dimension, event.location, event.source);
	}
});

world.afterEvents.projectileHitEntity.subscribe((event) => {
	if (event.projectile.typeId === ICE_BOMB_ID) {
		run(event.dimension, event.location, event.source);
	}
});
