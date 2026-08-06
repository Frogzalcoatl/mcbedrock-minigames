import { ItemStack, world } from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.FireCharge;
const nameTag: string = "§rBlaze Fireball";

export function itemBlazeFireball(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	return item;
}

world.afterEvents.itemUse.subscribe((e) => {
	if (!itemNameMatches(e.itemStack, typeId, nameTag)) {
		return;
	}
	e.source.dimension.spawnEntity(MinecraftEntityTypes.SmallFireball, e.source.location);
});
