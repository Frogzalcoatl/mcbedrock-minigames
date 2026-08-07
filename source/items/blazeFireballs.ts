import {
	EntityComponentTypes,
	GameMode,
	ItemStack,
	type ItemUseAfterEvent,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { throwFireballFromEntity } from "../entities/fireball";
import { itemNameMatches } from "./utils/matches";
import { removeItem } from "./utils/remove";

const typeId: string = MinecraftItemTypes.FireCharge;
const nameTag: string = "§rBlaze Fireball";

export function itemBlazeFireball(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	return item;
}

export function itemBlazeFireballRun(event: ItemUseAfterEvent): void {
	if (itemNameMatches(event.itemStack, typeId, nameTag)) {
		const inventory = event.source.getComponent(EntityComponentTypes.Inventory);
		if (inventory === undefined) {
			return;
		}
		if (event.source.getGameMode() !== GameMode.Creative) {
			removeItem(inventory.container, event.itemStack, 1);
		}
		throwFireballFromEntity("small", 4, event.source);
		event.source.dimension.playSound("mob.blaze.shoot", event.source.location);
	}
}
