import { GameMode, type ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { tools } from "../../tools";
import { throwFireballFromEntity } from "../../tools/projectiles/fireball";
import { decrementMainhandItem, defaultItemStackFunc } from "../../tools/shared/componentHelpers";

const typeId: string = MinecraftItemTypes.FireCharge;
const nameTag: string = "§rBlaze Fireball";
const blazeFireballSpeed: number = 4;

tools.items.onUse(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	if (event.source.getGameMode() !== GameMode.Creative) {
		decrementMainhandItem(event.source);
	}
	throwFireballFromEntity(event.source, MinecraftEntityTypes.SmallFireball, blazeFireballSpeed);
	event.source.dimension.playSound("mob.blaze.shoot", event.source.location);
});

export function itemBlazeFireball(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
