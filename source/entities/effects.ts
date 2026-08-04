import type { Entity } from "@minecraft/server";

export function clearEntityEffects(entity: Entity): void {
	if (!entity.isValid) {
		return;
	}
	for (const effect of entity.getEffects()) {
		entity.removeEffect(effect.typeId);
	}
}
