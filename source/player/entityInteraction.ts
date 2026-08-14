import {
	EntityComponentTypes,
	type EntityEquippableComponent,
	EquipmentSlot,
	type ItemStack,
	type ItemUseAfterEvent,
	system,
	world,
} from "@minecraft/server";
import { itemUseHandler } from "../items/events/itemUse";

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
	event.cancel = true;
	system.run(() => {
		const equippable: EntityEquippableComponent | undefined = event.player.getComponent(
			EntityComponentTypes.Equippable,
		);
		if (equippable === undefined) {
			return;
		}
		const mainhandItem: ItemStack | undefined = equippable.getEquipment(EquipmentSlot.Mainhand);
		if (mainhandItem === undefined) {
			return;
		}
		const itemUseEvent: ItemUseAfterEvent = {
			itemStack: mainhandItem,
			source: event.player,
		};
		itemUseHandler(itemUseEvent);
	});
});
