import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { defaultItemStackFunc } from "./utils/default";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.Pufferfish;
const nameTag: string = "§r§aPoison Projectile§7 (Use)";

export function itemPoisonFishProjectile(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

export function itemPoisonFishProjectileRun(event: ItemUseAfterEvent): void {
	if (itemNameMatches(event.itemStack, typeId, nameTag)) {
		event.source.dimension.playSound(
			"cauldron_drip.water.pointed_dripstone",
			event.source.location,
		);
	}
}
