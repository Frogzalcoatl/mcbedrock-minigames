import {
	EntityComponentTypes,
	type EntityInventoryComponent,
	GameMode,
	type Player,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
import { clearEntityEffects } from "../../entities/effects";
import { setEntityHealth } from "../../entities/health";
import { clearEntityInventory } from "../../entities/inventory";
import { itemTeleporter } from "../../items/games/mainHub/teleporter";
import { Room, type RoomCreationFunc } from "../../rooms/room";

export const getRoomHub: RoomCreationFunc = (
	roomTypeIndex: number,
	roomIndex: number,
	dimensionId: string,
	displayName: string,
	icon: string,
): Room => {
	return new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		onJoin: (player: Player): void => {
			player.setGameMode(GameMode.Adventure);
			clearEntityInventory(player);
			setEntityHealth(player, "max");
			clearEntityEffects(player);
			player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
				amplifier: 255,
				showParticles: false,
			});
			player.addEffect(MinecraftEffectTypes.Weakness, MAX_EFFECT_DURATION, {
				amplifier: 255,
				showParticles: false,
			});
			const inventory: EntityInventoryComponent | undefined = player.getComponent(
				EntityComponentTypes.Inventory,
			);
			if (inventory !== undefined) {
				inventory.container.setItem(4, itemTeleporter());
			}
		},
		roomIndex: roomIndex,
		roomTypeIndex: roomTypeIndex,
		spawn: { x: 0.5, y: 0, z: 0.5 },
		structures: [{ id: "ghostly/spawn", pos: { x: -55, y: -11, z: -59 } }],
	});
};
