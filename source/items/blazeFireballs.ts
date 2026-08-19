import {
	EntityComponentTypes,
	GameMode,
	type ItemStack,
	type ItemUseAfterEvent,
} from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { throwFireballFromEntity } from "../entities/fireball";
import { defaultItemStackFunc } from "./utils/default";
import { itemNameMatches } from "./utils/matches";
import { decrementMainhandItem } from "./utils/remove";

const typeId: string = MinecraftItemTypes.FireCharge;
const nameTag: string = "§rBlaze Fireball";
const blazeFireballSpeed: number = 4;

export function itemBlazeFireball(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

export function itemBlazeFireballRun(event: ItemUseAfterEvent): void {
	if (itemNameMatches(event.itemStack, typeId, nameTag)) {
		const inventory = event.source.getComponent(EntityComponentTypes.Inventory);
		if (inventory === undefined) {
			return;
		}
		if (event.source.getGameMode() !== GameMode.Creative) {
			if (!decrementMainhandItem(event.source)) {
				return;
			}
		}
		throwFireballFromEntity(
			MinecraftEntityTypes.SmallFireball,
			blazeFireballSpeed,
			event.source,
		);
		event.source.dimension.playSound("mob.blaze.shoot", event.source.location);
	}
}
