import {
	EntityComponentTypes,
	type EntityEquippableComponent,
	EquipmentSlot,
	ItemStack,
	world,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.BlazeRod;
const nameTag: string = "§r§eFire Sitck";

export function itemFireStick(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	return item;
}

world.afterEvents.entityHitEntity.subscribe((e) => {
	const equippable: EntityEquippableComponent | undefined = e.damagingEntity.getComponent(
		EntityComponentTypes.Equippable,
	);
	if (equippable === undefined) {
		return;
	}
	const mainhandItem: ItemStack | undefined = equippable.getEquipment(EquipmentSlot.Mainhand);
	if (mainhandItem === undefined) {
		return;
	}
	if (!itemNameMatches(mainhandItem, typeId, nameTag)) {
		return;
	}
	e.hitEntity.setOnFire(5);
});
