import {
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	ItemStack,
	type ItemUseAfterEvent,
	system,
} from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { spawnTemporaryMount } from "../../../tools/actions/mount";
import { defaultItemStackFunc } from "../../../tools/componentHelpers";
import { itemCooldownCheck, itemCooldownSet } from "../../cooldowns";
import { itemUseMap } from "../../events";

const typeId: string = MinecraftItemTypes.ZombieHorseSpawnEgg;
const nameTag: string = "§r§dZombie Horse §7(Use)";
itemCooldownSet(nameTag, typeId, 20 * 15, true);
const horseRideDurationTicks: number = 20 * 8;

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (!itemCooldownCheck(event.source, event.itemStack)) {
			return;
		}
		const entity: Entity | null = spawnTemporaryMount(
			MinecraftEntityTypes.ZombieHorse,
			event.source,
			horseRideDurationTicks,
		);
		if (entity === null) {
			return;
		}
		system.runTimeout(() => {
			// Must wait one tick for inventory to exist
			if (!entity.isValid) {
				return;
			}
			entity.extinguishFire();
			const inventory: EntityInventoryComponent | undefined = entity.getComponent(
				EntityComponentTypes.Inventory,
			);
			if (inventory !== undefined) {
				inventory.container.setItem(0, new ItemStack(MinecraftItemTypes.Saddle));
				inventory.container.setItem(1, new ItemStack(MinecraftItemTypes.NetheriteHorseArmor));
			}
		}, 1);
	},
	typeId: typeId,
});

export function itemZombieHorse(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
