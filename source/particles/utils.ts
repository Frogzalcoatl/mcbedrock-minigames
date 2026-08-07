import type { Dimension, Vector3 } from "@minecraft/server";

function getRandomValWithinBounds(center: number, bounds: number): number {
	return center + (Math.random() > 0.5 ? -1 : 1) * Math.random() * bounds;
}

export function spawnParticlesWithinBounds(
	particle: string,
	dimension: Dimension,
	position: Vector3,
	amount: number,
	horizontal: number,
	vertical: number,
): void {
	for (let i: number = 0; i < amount; i++) {
		const particlePos: Vector3 = {
			x: getRandomValWithinBounds(position.x, horizontal),
			y: getRandomValWithinBounds(position.y, vertical),
			z: getRandomValWithinBounds(position.z, horizontal),
		};
		dimension.spawnParticle(particle, particlePos);
	}
}
