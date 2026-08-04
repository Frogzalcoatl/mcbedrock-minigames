import { type Entity, EntityComponentTypes, type EntityHealthComponent } from "@minecraft/server";

export function setEntityHealth(entity: Entity, value: number | "min" | "max" | "default"): void {
	if (!entity.isValid) {
		return;
	}
	const health: EntityHealthComponent | undefined = entity.getComponent(
		EntityComponentTypes.Health,
	);
	if (health === undefined || !health.isValid) {
		return;
	}
	if (value === "max") {
		health.resetToMaxValue();
	} else if (value === "min") {
		health.resetToMinValue();
	} else if (value === "default") {
		health.resetToDefaultValue();
	} else {
		if (value > health.effectiveMax || value < health.effectiveMin) {
			return;
		}
		health.setCurrentValue(value);
	}
}
