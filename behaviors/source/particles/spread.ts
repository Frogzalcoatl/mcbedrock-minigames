import type { Dimension, Vector3 } from "@minecraft/server";

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
	for (let i: number = 0; i < particleCount; i++) {
		const particlePos: Vector3 = {
			x: minX + Math.random() * (maxX - minX),
			y: minY + Math.random() * (maxY - minY),
			z: minZ + Math.random() * (maxZ - minZ),
		};
		dimension.spawnParticle(particle, particlePos);
	}
}
