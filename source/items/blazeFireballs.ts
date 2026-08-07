import { ItemStack, type Player } from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.FireCharge;
const nameTag: string = "§rBlaze Fireball";

export function itemBlazeFireball(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	return item;
}

export function isItemBlazeFireball(item: ItemStack): boolean {
	return itemNameMatches(item, typeId, nameTag);
}

export function itemBlazeFireballRun(source: Player): void {
	source.dimension.spawnEntity(MinecraftEntityTypes.SmallFireball, source.location);
}
