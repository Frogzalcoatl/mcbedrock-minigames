import {
	type Dimension,
	EntityComponentTypes,
	type EntityInventoryComponent,
	GameMode,
	type Player,
	PlayerPermissionLevel,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { itemSettings } from "../../items/settings";
import { itemTeleporter } from "../../items/teleporter";
import { tools } from "../../tools";
import { gameIds, PACK_NAMESPACE } from "../../tools/constants";
import { Game } from "../../tools/game/game";
import { GameType } from "../../tools/game/gameType";
import { clearEntityEquippable, hubEffectHelper } from "../../tools/helpers/entityComponents";
import {
	GameJoinResult,
	QueueMode,
	type TeleportLocation,
	teleportLocationDefault,
} from "../../tools/types";

const HUB_COUNT = 3;

// biome-ignore lint/style/useExportsLast: Makes more sense here
export const mainHub = new GameType(
	gameIds.mainHub,
	"textures/items/ender_eye.png",
	"Hub",
	QueueMode.FullyRandom,
);
tools.games.types.push(mainHub);

class MainHub extends Game {
	public constructor(
		id: string,
		dimension: Dimension,
		spawn: TeleportLocation = teleportLocationDefault(),
	) {
		super(id, dimension, spawn);
	}

	public canJoin(): GameJoinResult {
		return GameJoinResult.Success;
	}

	public join(player: Player): GameJoinResult {
		this.addPlayer(player);
		player.setGameMode(GameMode.Adventure);
		hubEffectHelper(player);
		clearEntityEquippable(player);
		const inventory: EntityInventoryComponent | undefined = player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			inventory.container.clearAll();
			inventory.container.setItem(4, itemTeleporter());
			if (player.playerPermissionLevel === PlayerPermissionLevel.Operator) {
				inventory.container.setItem(0, itemSettings());
			}
		}
		return GameJoinResult.Success;
	}

	public leave(playerId: string): void {
		this.removePlayer(playerId);
	}

	public reset(): void {
		const loadPos: Vector3 = {
			x: this.spawn.pos.x - 55,
			y: this.spawn.pos.y - 11,
			z: this.spawn.pos.z - 59,
		};
		tools.structures.load("ghostly/spawn", loadPos, this.dimension);
	}
}

if (HUB_COUNT >= 1) {
	mainHub.instances.push(
		new MainHub("hub-1", world.getDimension(MinecraftDimensionTypes.Overworld)),
	);
}

system.beforeEvents.startup.subscribe((event): void => {
	for (let i = 2; i <= HUB_COUNT; i++) {
		event.dimensionRegistry.registerCustomDimension(`${PACK_NAMESPACE}:main_hub_${i}`);
	}
});

world.afterEvents.worldLoad.subscribe(() => {
	for (let i = 2; i <= HUB_COUNT; i++) {
		mainHub.instances.push(
			new MainHub(`hub-${i}`, world.getDimension(`${PACK_NAMESPACE}:main_hub`)),
		);
	}
});
