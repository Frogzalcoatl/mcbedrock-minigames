import { ItemStack, type ItemUseAfterEvent, world } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { isItemCooldownFinished } from "../rooms/modules/itemCooldownManager";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.BreezeRod;
const nameTag = "§rBreeze Leap";

export function itemBreezeLeap(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	return item;
}

export function itemBreezeLeapRun(event: ItemUseAfterEvent): void {
	if (
		itemNameMatches(event.itemStack, typeId, nameTag) &&
		isItemCooldownFinished(event.source, event.itemStack)
	) {
		world.sendMessage("Dih");
	}
}
