import { GameMode, type ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { decrementMainhandItem, defaultItemStackFunc } from "../../../tools/helpers";
import { throwFireballFromEntity } from "../../../tools/projectiles/fireball";
import { itemUseMap } from "../../events";

const typeId: string = MinecraftItemTypes.FireCharge;
const nameTag: string = "§rBlaze Fireball";
const blazeFireballSpeed: number = 4;

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (event.source.getGameMode() !== GameMode.Creative) {
			decrementMainhandItem(event.source);
		}
		throwFireballFromEntity(event.source, MinecraftEntityTypes.SmallFireball, blazeFireballSpeed);
		event.source.dimension.playSound("mob.blaze.shoot", event.source.location);
	},
	typeId: typeId,
});

export function itemBlazeFireball(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
