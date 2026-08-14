import type { Dimension, Vector3 } from "@minecraft/server";
import { getRandomValWithinBounds } from "./random";

export function spreadParticles(
	particle: string,
	dimension: Dimension,
	position: Vector3,
	horizontalSpread: number,
	verticalSpread: number,
	particleCount: number,
): void {
	for (let i: number = 0; i < particleCount; i++) {
		const particlePos: Vector3 = {
			x: getRandomValWithinBounds(position.x, horizontalSpread),
			y: getRandomValWithinBounds(position.y, verticalSpread),
			z: getRandomValWithinBounds(position.z, horizontalSpread),
		};
		dimension.spawnParticle(particle, particlePos);
	}
}
