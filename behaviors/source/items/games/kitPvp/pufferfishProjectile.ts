import { GameMode, type ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { decrementMainhandItem, defaultItemStackFunc } from "../../../tools/helpers";
import { pufferfishProjectile } from "../../../tools/projectiles/pufferfish";
import { itemUseMap } from "../../events";

const typeId: string = MinecraftItemTypes.Pufferfish;
const nameTag: string = "§r§aPufferfish§7 (Use)";

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (event.source.getGameMode() !== GameMode.Creative) {
			decrementMainhandItem(event.source);
		}
		event.source.dimension.playSound(
			"cauldron_drip.water.pointed_dripstone",
			event.source.location,
		);
		pufferfishProjectile(event.source, 2, 0.25);
	},
	typeId: typeId,
});

export function itemPoisonFishProjectile(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
