import type { Dimension, Vector3 } from "@minecraft/server";

export function beamParticles(
	particle: string,
	dimension: Dimension,
	startPos: Vector3,
	endPos: Vector3,
	spacing: number,
): void {
	const distanceX: number = endPos.x - startPos.x;
	const distanceY: number = endPos.y - startPos.y;
	const distanceZ: number = endPos.z - startPos.z;
	const distance: number = Math.sqrt(
		distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ,
	);
	if (distance === 0) {
		dimension.spawnParticle(particle, startPos);
		return;
	}
	const changeByX: number = (distanceX / distance) * spacing;
	const changeByY: number = (distanceY / distance) * spacing;
	const changeByZ: number = (distanceZ / distance) * spacing;
	const current: Vector3 = startPos;
	for (let distanceTraveled: number = 0; distanceTraveled < distance; distanceTraveled++) {
		dimension.spawnParticle(particle, current);
		current.x += changeByX;
		current.y += changeByY;
		current.z += changeByZ;
	}
}
