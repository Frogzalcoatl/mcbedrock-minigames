import { ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.FireCharge;
const nameTag: string = "§rBlaze Fireball";

export function itemBlazeFireball(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	return item;
}

export function itemBlazeFireballRun(event: ItemUseAfterEvent): void {
	if (itemNameMatches(event.itemStack, typeId, nameTag)) {
		event.source.dimension.spawnEntity(
			MinecraftEntityTypes.SmallFireball,
			event.source.location,
		);
	}
}
