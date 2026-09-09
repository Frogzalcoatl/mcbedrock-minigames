import { type ItemCompleteUseAfterEvent, world } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";

world.afterEvents.itemCompleteUse.subscribe((event: ItemCompleteUseAfterEvent) => {
	// Limit gapple absorption level to match java
	if (event.itemStack.typeId === MinecraftItemTypes.GoldenApple) {
		event.source.removeEffect(MinecraftEffectTypes.Absorption);
		event.source.addEffect(MinecraftEffectTypes.Absorption, 20 * 120);
	}
});
