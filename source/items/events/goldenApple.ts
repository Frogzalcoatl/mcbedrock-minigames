import { type ItemCompleteUseAfterEvent, world } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";

function limitGappleAbsorptionLevel(event: ItemCompleteUseAfterEvent): void {
	if (event.itemStack.typeId === MinecraftItemTypes.GoldenApple) {
		event.source.removeEffect(MinecraftEffectTypes.Absorption);
		event.source.addEffect(MinecraftEffectTypes.Absorption, 20 * 120);
	}
}

world.afterEvents.itemCompleteUse.subscribe(limitGappleAbsorptionLevel);
