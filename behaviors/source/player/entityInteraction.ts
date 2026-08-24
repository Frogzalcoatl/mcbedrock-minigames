import {
	EntityComponentTypes,
	type EntityEquippableComponent,
	EquipmentSlot,
	type ItemStack,
	type ItemUseAfterEvent,
	system,
	world,
} from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { itemUseHandler } from "../items/events/itemUse";

const typeIdsForItemUseTrigger: string[] = [
	MinecraftEntityTypes.Villager,
	MinecraftEntityTypes.Npc,
	MinecraftEntityTypes.VillagerV2,
	MinecraftEntityTypes.WanderingTrader,
];

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
	event.cancel = true;
	if (!typeIdsForItemUseTrigger.includes(event.target.typeId)) {
		return;
	}
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
