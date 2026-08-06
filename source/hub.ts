import {
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	GameMode,
	Player,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "./constants";
import { clearEntityInventory } from "./entities/clearEntityInventory";
import { clearEntityEffects } from "./entities/effects";
import { setEntityHealth } from "./entities/health";
import { itemKitSelect } from "./items/hubItems";
import { getBlockInteractionManager } from "./rooms/modules/blockInteraction";
import { Room } from "./rooms/room";

export function getRoomHub(
	roomIndex: number,
	dimensionId: string,
	displayName: string = "Hub",
): Room {
	return new Room({
		blockInteraction: getBlockInteractionManager(dimensionId, null),
		dimensionId: dimensionId,
		displayName: displayName,
		onJoin: (entity: Entity): void => {
			if (entity instanceof Player) {
				entity.setGameMode(GameMode.Adventure);
			}
			clearEntityInventory(entity);
			clearEntityEffects(entity);
			setEntityHealth(entity, "max");
			entity.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
				amplifier: 255,
				showParticles: false,
			});
			entity.addEffect(MinecraftEffectTypes.Weakness, MAX_EFFECT_DURATION, {
				amplifier: 255,
				showParticles: false,
			});
			const inventory: EntityInventoryComponent | undefined = entity.getComponent(
				EntityComponentTypes.Inventory,
			);
			if (inventory === undefined || !inventory.isValid || !inventory.container.isValid) {
				return;
			}
			inventory.container.addItem(itemKitSelect());
		},
		roomIndex: roomIndex,
		spawn: { x: 0, y: 0, z: 0 },
		structures: [{ id: "ghostlySpawn", pos: { x: -55, y: -11, z: -59 } }],
	});
}
