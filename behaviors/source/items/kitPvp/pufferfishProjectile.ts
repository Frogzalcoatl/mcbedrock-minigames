import { GameMode, type ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { tools } from "../../tools";
import { decrementMainhandItem, defaultItemStackFunc } from "../../tools/helpers/entityComponents";
import { pufferfishProjectile } from "../../tools/projectiles/pufferfish";

const typeId: string = MinecraftItemTypes.Pufferfish;
const nameTag: string = "§r§aPufferfish§7 (Use)";

tools.items.itemUseSet(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	if (event.source.getGameMode() !== GameMode.Creative) {
		decrementMainhandItem(event.source);
	}
	event.source.dimension.playSound("cauldron_drip.water.pointed_dripstone", event.source.location);
	pufferfishProjectile(event.source, 2, 0.25);
});

export function itemPufferfishProjectile(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
