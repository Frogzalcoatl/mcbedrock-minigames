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
	for (let distanceTraveled = 0; distanceTraveled < distance; distanceTraveled += spacing) {
		dimension.spawnParticle(particle, current);
		current.x += changeByX;
		current.y += changeByY;
		current.z += changeByZ;
	}
}

export function spreadParticles(
	particle: string,
	dimension: Dimension,
	position: Vector3,
	horizontalSpread: number,
	verticalSpread: number,
	particleCount: number,
): void {
	const minX: number = position.x - horizontalSpread;
	const maxX: number = position.x + horizontalSpread;
	const minY: number = position.y - verticalSpread;
	const maxY: number = position.y + verticalSpread;
	const minZ: number = position.z - horizontalSpread;
	const maxZ: number = position.z + horizontalSpread;
	for (let i = 0; i < particleCount; i++) {
		const particlePos: Vector3 = {
			x: minX + Math.random() * (maxX - minX),
			y: minY + Math.random() * (maxY - minY),
			z: minZ + Math.random() * (maxZ - minZ),
		};
		dimension.spawnParticle(particle, particlePos);
	}
}
