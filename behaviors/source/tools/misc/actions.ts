import {
	type Dimension,
	type Entity,
	EntityComponentTypes,
	type EntityRideableComponent,
	type EntityRidingComponent,
	type EntityTameMountComponent,
	type Player,
	system,
	type Vector3,
	type VectorXZ,
	world,
} from "@minecraft/server";
import type { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { spreadParticles } from "./particles";

const temporaryMountPropertyId: string = "is_temporary_mount";

world.afterEvents.entityLoad.subscribe((event) => {
	if (
		event.entity.isValid &&
		event.entity.getDynamicProperty(temporaryMountPropertyId) !== undefined
	) {
		event.entity.remove();
	}
});

function despawnEffects(pos: Vector3, dimension: Dimension): void {
	dimension.playSound("random.fizz", pos);
	spreadParticles("minecraft:dust_plume", dimension, pos, 1, 1, 20);
}

// Returns mount entity
export function spawnTemporaryMount(
	mountType: MinecraftEntityTypes,
	player: Player,
	durationTicks: number,
): Entity | null {
	const mountEntity: Entity = player.dimension.spawnEntity(mountType, player.location, {
		spawnEvent: "minecraft:spawn_adult",
	});
	mountEntity.setDynamicProperty(temporaryMountPropertyId, true);
	const tameMount: EntityTameMountComponent | undefined = mountEntity.getComponent(
		EntityComponentTypes.TameMount,
	);
	if (tameMount === undefined) {
		mountEntity.remove();
		return null;
	}
	tameMount.tameToPlayer(false, player);
	const rideable: EntityRideableComponent | undefined = mountEntity.getComponent(
		EntityComponentTypes.Rideable,
	);
	if (rideable === undefined) {
		mountEntity.remove();
		return null;
	}
	rideable.addRider(player);
	let tickCount = 0;
	const intervalId: number = system.runInterval(() => {
		tickCount++;
		if (!rideable.isValid || rideable.getRiders().length === 0) {
			if (mountEntity.isValid) {
				despawnEffects(mountEntity.location, mountEntity.dimension);
				mountEntity.remove();
			}
			system.clearRun(intervalId);
			return;
		}
		if (tickCount >= durationTicks) {
			system.clearRun(intervalId);
			return;
		}
	});
	system.runTimeout(() => {
		if (mountEntity.isValid) {
			despawnEffects(mountEntity.location, mountEntity.dimension);
			mountEntity.remove();
		}
	}, durationTicks);
	return mountEntity;
}

export function ejectFromMount(entity: Entity): void {
	const riding: EntityRidingComponent | undefined = entity.getComponent(
		EntityComponentTypes.Riding,
	);
	if (riding === undefined || !riding.entityRidingOn.isValid) {
		return;
	}
	const rideable: EntityRideableComponent | undefined = riding.entityRidingOn.getComponent(
		EntityComponentTypes.Rideable,
	);
	if (rideable !== undefined) {
		rideable.ejectRider(entity);
	}
}

export function entityLeap(entity: Entity, horizontalForce: number, verticalForce: number): void {
	const viewDirection: Vector3 = entity.getViewDirection();
	const knockbackXz: VectorXZ = {
		x: viewDirection.x * horizontalForce,
		z: viewDirection.z * horizontalForce,
	};
	const riding: EntityRidingComponent | undefined = entity.getComponent(
		EntityComponentTypes.Riding,
	);
	if (riding?.entityRidingOn.isValid) {
		riding.entityRidingOn.applyKnockback(knockbackXz, verticalForce);
	} else {
		entity.applyKnockback(knockbackXz, verticalForce);
	}
}
