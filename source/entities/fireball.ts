import { type AABB, type Entity, EntityComponentTypes, type Vector3 } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";

export function throwFireballFromEntity(
	type: "small" | "large" | "dragon",
	speed: number,
	entity: Entity,
): void {
	const entityAabb: AABB = entity.getAABB();
	const headLocation: Vector3 = entity.getHeadLocation();
	const viewDirection: Vector3 = entity.getViewDirection();
	const spawnLocation: Vector3 = {
		x: headLocation.x + viewDirection.x * entityAabb.extent.x,
		y: headLocation.y + viewDirection.y * entityAabb.extent.y,
		z: headLocation.z + viewDirection.z * entityAabb.extent.z,
	};
	const typeId: MinecraftEntityTypes =
		type === "small"
			? MinecraftEntityTypes.SmallFireball
			: type === "dragon"
				? MinecraftEntityTypes.DragonFireball
				: MinecraftEntityTypes.Fireball;
	const fireballEntity: Entity = entity.dimension.spawnEntity(typeId, spawnLocation);
	const fireballImpulse: Vector3 = {
		x: viewDirection.x * speed,
		y: viewDirection.y * speed,
		z: viewDirection.z * speed,
	};
	const projectile = fireballEntity.getComponent(EntityComponentTypes.Projectile);
	if (projectile !== undefined) {
		projectile.owner = entity;
	}
	fireballEntity.applyImpulse(fireballImpulse);
}
