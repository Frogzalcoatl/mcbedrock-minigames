import type { Dimension, Vector3 } from "@minecraft/server";
import { randomValueWithinRange } from "./random";

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
			x: randomValueWithinRange(position.x - horizontalSpread, position.x + horizontalSpread),
			y: randomValueWithinRange(position.y - verticalSpread, position.y + verticalSpread),
			z: randomValueWithinRange(position.z - horizontalSpread, position.z + horizontalSpread),
		};
		dimension.spawnParticle(particle, particlePos);
	}
}
