import {
	type Dimension,
	type Entity,
	Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { spreadParticles } from "../particles/spread";
import { killTrackerSetCombat } from "./killTracker";

function despawnEffects(pos: Vector3, dimension: Dimension): void {
	dimension.playSound("random.fizz", pos);
	pos.y += 0.5;
	spreadParticles("minecraft:dust_plume", dimension, pos, 3, 0.5, 40);
	spreadParticles("minecraft:water_splash_particle_manual", dimension, pos, 1, 0.25, 10);
}

function applyPoisonToEntities(thrower: Entity, pufferfish: Entity, maxDistance: number): void {
	const hitEntities: Entity[] = pufferfish.dimension.getEntities({
		location: pufferfish.location,
		maxDistance: maxDistance,
	});
	for (const entity of hitEntities) {
		if (entity.id === thrower.id || entity.typeId === MinecraftEntityTypes.Pufferfish) {
			continue;
		}
		entity.addEffect(MinecraftEffectTypes.Poison, 20 * 10);
		if (entity instanceof Player) {
			killTrackerSetCombat(entity, thrower);
		}
	}
}

const maxTicks: number = 20 * 10;

export function pufferfishProjectile(
	thrower: Entity,
	horizontalVelocity: number,
	verticalVelocity: number,
): void {
	const viewDirection: Vector3 = thrower.getViewDirection();
	const headLocation: Vector3 = thrower.getHeadLocation();
	const pufferfish: Entity = thrower.dimension.spawnEntity(
		MinecraftEntityTypes.Pufferfish,
		headLocation,
	);
	pufferfish.applyKnockback(
		{
			x: viewDirection.x * horizontalVelocity,
			z: viewDirection.z * horizontalVelocity,
		},
		viewDirection.y * verticalVelocity,
	);
	let tickCount: number = 0;
	const intervalId: number = system.runInterval(() => {
		if (!pufferfish.isValid) {
			system.clearRun(intervalId);
			return;
		}
		applyPoisonToEntities(thrower, pufferfish, 2);
		if (tickCount > maxTicks || (pufferfish.isOnGround && tickCount !== 0)) {
			system.clearRun(intervalId);
			applyPoisonToEntities(thrower, pufferfish, 3);
			despawnEffects(pufferfish.location, pufferfish.dimension);
			pufferfish.remove();
			return;
		}
		tickCount++;
	});
}

world.afterEvents.entityLoad.subscribe((event) => {
	if (event.entity.typeId === MinecraftEntityTypes.Pufferfish) {
		event.entity.remove();
	}
});
