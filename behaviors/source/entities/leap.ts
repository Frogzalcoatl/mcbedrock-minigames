import {
	type Entity,
	EntityComponentTypes,
	type EntityRidingComponent,
	type Vector3,
	type VectorXZ,
} from "@minecraft/server";

export function entityLeap(entity: Entity, horizontalForce: number, verticalForce: number): void {
	const viewDirection: Vector3 = entity.getViewDirection();
	const knockbackXz: VectorXZ = {
		x: viewDirection.x * horizontalForce,
		z: viewDirection.z * horizontalForce,
	};
	const riding: EntityRidingComponent | undefined = entity.getComponent(
		EntityComponentTypes.Riding,
	);
	if (riding !== undefined) {
		try {
			// Throws an error when entityRidingOn is removed in same tick
			riding.entityRidingOn.applyKnockback(knockbackXz, verticalForce);
		} catch (_error) {
			entity.applyKnockback(knockbackXz, verticalForce);
		}
	} else {
		entity.applyKnockback(knockbackXz, verticalForce);
	}
}
