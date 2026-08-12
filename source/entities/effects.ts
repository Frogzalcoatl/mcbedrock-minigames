import type { Entity } from "@minecraft/server";

export function clearEntityEffects(entity: Entity): void {
	for (const effect of entity.getEffects()) {
		entity.removeEffect(effect.typeId);
	}
}
