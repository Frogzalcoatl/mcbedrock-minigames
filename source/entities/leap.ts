import {
	type Entity,
	EntityComponentTypes,
	type EntityRidingComponent,
	type Vector3,
	type VectorXZ,
} from "@minecraft/server";

export function entityLeap(
	entity: Entity,
	horizontalStrength: number,
	verticalStrength: number,
): void {
	const viewDirection: Vector3 = entity.getViewDirection();
	const knockbackXz: VectorXZ = {
		x: viewDirection.x * horizontalStrength,
		z: viewDirection.z * horizontalStrength,
	};
	const riding: EntityRidingComponent | undefined = entity.getComponent(
		EntityComponentTypes.Riding,
	);
	if (riding !== undefined) {
		riding.entityRidingOn.applyKnockback(knockbackXz, verticalStrength);
	} else {
		entity.applyKnockback(knockbackXz, verticalStrength);
	}
}
