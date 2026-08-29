import type { BlockRaycastHit, Entity, EntityRaycastHit, Vector3 } from "@minecraft/server";

export function beamFrom(
	entity: Entity,
	maxDistance: number,
	onHit: (from: Entity, hitLocation: Vector3, hitEntity?: Entity) => void,
): void {
	const viewDirection: Vector3 = entity.getViewDirection();
	const headLocation: Vector3 = entity.getHeadLocation();
	let endPos: Vector3 | undefined;
	const entities: EntityRaycastHit[] = entity.getEntitiesFromViewDirection({
		maxDistance: maxDistance,
	});
	const hitEntityRaycast: EntityRaycastHit | undefined = entities[0];
	if (hitEntityRaycast !== undefined) {
		endPos = {
			x: headLocation.x + viewDirection.x * hitEntityRaycast.distance,
			y: headLocation.y + viewDirection.y * hitEntityRaycast.distance,
			z: headLocation.z + viewDirection.z * hitEntityRaycast.distance,
		};
	} else {
		const blockRaycast: BlockRaycastHit | undefined = entity.getBlockFromViewDirection({
			maxDistance: maxDistance,
		});
		if (blockRaycast !== undefined) {
			endPos = blockRaycast.block.location;
			endPos.x += blockRaycast.faceLocation.x;
			endPos.y += blockRaycast.faceLocation.y;
			endPos.z += blockRaycast.faceLocation.z;
		}
	}
	if (endPos === undefined) {
		endPos = {
			x: headLocation.x + viewDirection.x * maxDistance,
			y: headLocation.y + viewDirection.y * maxDistance,
			z: headLocation.z + viewDirection.z * maxDistance,
		};
	}
	onHit(entity, endPos, hitEntityRaycast?.entity);
}
