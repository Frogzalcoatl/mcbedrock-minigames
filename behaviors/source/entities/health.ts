import { type Entity, EntityComponentTypes, type EntityHealthComponent } from "@minecraft/server";

export function changeEntityHealth(entity: Entity, by: number): void {
	const health: EntityHealthComponent | undefined = entity.getComponent(
		EntityComponentTypes.Health,
	);
	if (health === undefined) {
		return;
	}
	const newValue = health.currentValue + by;
	if (newValue > health.effectiveMax) {
		health.resetToMaxValue();
	} else if (newValue < health.effectiveMin) {
		health.resetToMinValue();
	} else {
		health.setCurrentValue(newValue);
	}
}
