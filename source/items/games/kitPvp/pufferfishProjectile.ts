import { GameMode, type ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { pufferfishProjectile } from "../../../entities/pufferfishProjectile";
import { itemUseMap } from "../../events/itemUse";
import { defaultItemStackFunc } from "../../utils/default";
import { decrementMainhandItem } from "../../utils/remove";

const typeId: string = MinecraftItemTypes.Pufferfish;
const nameTag: string = "§r§aPufferfish§7 (Use)";

export function itemPoisonFishProjectile(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

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
