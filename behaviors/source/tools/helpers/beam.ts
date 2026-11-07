import type { BlockRaycastHit, Entity, EntityRaycastHit, Vector3 } from "@minecraft/server";
import { vector3Distance } from "../shared/locations";

export function beamFromEntity(
	entity: Entity,
	maxDistance: number,
	onHit: (from: Entity, hitLocation: Vector3, hitEntity?: Entity) => void,
): void {
	const viewDirection: Vector3 = entity.getViewDirection();
	const headLocation: Vector3 = entity.getHeadLocation();
	const entityRaycasts: EntityRaycastHit[] = entity.getEntitiesFromViewDirection({
		maxDistance: maxDistance,
	});
	const entityRaycast: EntityRaycastHit | undefined = entityRaycasts[0];
	const blockRaycast: BlockRaycastHit | undefined = entity.getBlockFromViewDirection({
		maxDistance: maxDistance,
	});
	let blockLocation: Vector3 | undefined;
	if (blockRaycast !== undefined) {
		blockLocation = blockRaycast.block.location;
		blockLocation.x += blockRaycast.faceLocation.x;
		blockLocation.y += blockRaycast.faceLocation.y;
		blockLocation.z += blockRaycast.faceLocation.z;
	}
	let hitPos: Vector3;
	if (entityRaycast !== undefined && blockLocation !== undefined) {
		const blockDistance: number = vector3Distance(headLocation, blockLocation);
		if (blockDistance <= entityRaycast.distance) {
			hitPos = blockLocation;
		} else {
			hitPos = entityRaycast.entity.location;
		}
	} else if (entityRaycast !== undefined) {
		hitPos = entityRaycast.entity.location;
	} else if (blockLocation !== undefined) {
		hitPos = blockLocation;
	} else {
		hitPos = {
			x: headLocation.x + viewDirection.x * maxDistance,
			y: headLocation.y + viewDirection.y * maxDistance,
			z: headLocation.z + viewDirection.z * maxDistance,
		};
	}
	onHit(entity, hitPos, entityRaycast?.entity);
}
