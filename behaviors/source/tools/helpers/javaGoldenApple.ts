import { type ItemCompleteUseAfterEvent, world } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";

function itemCompleteUse(event: ItemCompleteUseAfterEvent): void {
	// Limit gapple absorption level to match java
	if (event.itemStack.typeId === MinecraftItemTypes.GoldenApple) {
		event.source.removeEffect(MinecraftEffectTypes.Absorption);
		event.source.addEffect(MinecraftEffectTypes.Absorption, 20 * 120);
	}
}

export function initJavaGoldenApple(): void {
	world.afterEvents.itemCompleteUse.subscribe(itemCompleteUse);
}

export function shutdownJavaGoldenApple(): void {
	world.afterEvents.itemCompleteUse.unsubscribe(itemCompleteUse);
}
