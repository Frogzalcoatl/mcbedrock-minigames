export function getRandomValWithinBounds(center: number, bounds: number): number {
	return center + (Math.random() > 0.5 ? -1 : 1) * Math.random() * bounds;
}
