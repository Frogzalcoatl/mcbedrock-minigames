import {
	type Dimension,
	type Entity,
	EntityComponentTypes,
	type EntityDieAfterEvent,
	type EntityHealthComponent,
	type EntityInventoryComponent,
	GameMode,
	type Player,
	PlayerPermissionLevel,
	type StartupEvent,
	system,
	world,
} from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { itemKitPvpSelect } from "../../items/kitPvp/kitPvpSelect";
import { itemSettings } from "../../items/settings";
import { itemTeleporter } from "../../items/teleporter";
import { tools } from "../../tools";
import { gameIds, MAX_EFFECT_DURATION, PACK_NAMESPACE } from "../../tools/constants";
import { Game } from "../../tools/game/game";
import { GameType } from "../../tools/game/gameType";
import { KillTracker } from "../../tools/game/tools/killTracker";
import {
	changeEntityHealth,
	clearEntityEffects,
	clearEntityEquippable,
	clearEntityInventory,
	hubEffectHelper,
} from "../../tools/helpers/entityComponents";
import { deathMessageFromEvent } from "../../tools/helpers/textFormatting";
import {
	GameJoinResult,
	QueueMode,
	type TeleportLocation,
	teleportLocationDefault,
} from "../../tools/types";
import type { Kit } from "../../tools/world/kitManager";
import { getKitBlaze } from "./kits/blaze";
import { getKitBreeze } from "./kits/breeze";
import { getKitFisherman } from "./kits/fisherman";
import { getKitLancer } from "./kits/lancer";
import { getKitPoseidon } from "./kits/poseidon";
import { getKitRabbit } from "./kits/rabbit";
import { getKitSkirmisher } from "./kits/skirmisher";
import { getKitSnowman } from "./kits/snowman";

const healthAddedOnKill: number = 10;

const creator: RoomCreatorFunc = (dimensionId: string, displayName: string, icon: string): Room => {
	const room = new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		spawn: {
			facing: { x: 0.5, y: 0, z: 1 },
			pos: { x: 0.5, y: 0, z: 0.5 },
		},
		structures: [
			{ id: "ghostly/shopNoChests", pos: { x: -33, y: -3, z: -41 } },
			{ id: "ghostly/kitPvp", pos: { x: 128, y: 0, z: 128 } },
		],
	});
	room.onLeave.subscribe((event: RoomTransferEvent) => {
		tools.killTracker.removePlayer(event.player);
		tools.items.cooldowns.removePlayer(event.player);
		tools.projectileTracker.removeTrackedProjectiles(event.player.id);
		tools.kitManager.reset(event.player);
	});
	room.localHub = new LocalHub(room, room.spawn);
	room.localHub.onJoin.subscribe((event: LocalHubTransferEvent): void => {
		tools.killTracker.removePlayer(event.player);
		tools.items.cooldowns.removePlayer(event.player);
		tools.projectileTracker.removeTrackedProjectiles(event.player.id);
		tools.kitManager.reset(event.player);
		hubEffectHelper(event.player);
		event.player.setGameMode(GameMode.Adventure);
		clearEntityEquippable(event.player);
		const inventory: EntityInventoryComponent | undefined = event.player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			inventory.container.clearAll();
			inventory.container.setItem(3, itemKitPvpSelect());
			inventory.container.setItem(5, itemTeleporter());
			if (event.player.playerPermissionLevel === PlayerPermissionLevel.Operator) {
				inventory.container.setItem(0, itemSettings());
			}
		}
	});
	const killTracker: KillTrackerSettings = tools.killTracker.addDimension(room.dimensionId);
	killTracker.onKill.subscribe((event: EntityDieAfterEvent): void => {
		room.sendMessage(deathMessageFromEvent(event));
		if (event.damageSource.damagingEntity?.isValid) {
			const killer: Entity = event.damageSource.damagingEntity;
			system.run(() => changeEntityHealth(killer, healthAddedOnKill));
		}
	});
	killTracker.onRespawn.subscribe((player: Player) => {
		room.localHub?.join(player);
	});
	tools.projectileTracker.addDimension(room.dimensionId, [
		MinecraftEntityTypes.ThrownTrident,
		MinecraftEntityTypes.SmallFireball,
	]);
	return room;
};

const kitPvpHubGameType = new GameType(
	gameIds.kitPvpHub,
	"textures/items/blaze_powder.png",
	"Kit Pvp Hub",
	QueueMode.FirstOpenGame,
);

class KitPvpHub extends Game {
	public readonly kits: Kit[];

	public constructor(
		id: string,
		dimension: Dimension,
		spawn: TeleportLocation = teleportLocationDefault(),
	) {
		super(id, dimension, spawn);
		this.kits = [];
		system.run(() => {
			this.kits.push(
				getKitBlaze(),
				getKitBreeze(),
				getKitSnowman(),
				getKitFisherman(),
				getKitPoseidon(),
				getKitRabbit(),
				getKitSkirmisher(),
				getKitLancer(),
			);
		});
	}

	public canJoin(): GameJoinResult {
		return GameJoinResult.Success;
	}

	public join(player: Player): GameJoinResult {
		this.addPlayer(player);
		hubEffectHelper(player);
		player.setGameMode(GameMode.Adventure);
		clearEntityEquippable(player);
		const inventory: EntityInventoryComponent | undefined = player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			inventory.container.clearAll();
			inventory.container.setItem(3, itemKitPvpSelect());
			inventory.container.setItem(5, itemTeleporter());
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
		tools.structures.load(
			"ghostly/shopNoChests",
			{ x: this.spawn.pos.x - 33, y: this.spawn.pos.y - 3, z: this.spawn.pos.z - 41 },
			this.dimension,
		);
		tools.structures.load(
			"ghostly/kitPvp",
			{
				x: this.spawn.pos.x + 128,
				y: this.spawn.pos.y + 0,
				z: this.spawn.pos.z + 128,
			},
			this.dimension,
		);
	}
}

const kitPvpGameType = new GameType(
	gameIds.kitPvp,
	"textures/items/blaze_powder.png",
	"Kit Pvp",
	QueueMode.FirstOpenGame,
);

class KitPvp extends Game {
	private readonly _killTracker: KillTracker;

	public constructor(
		id: string,
		dimension: Dimension,
		spawn: TeleportLocation = teleportLocationDefault(),
	) {
		super(id, dimension, spawn);
		this._killTracker = new KillTracker(140);
	}

	public canJoin(): GameJoinResult {
		return GameJoinResult.Success;
	}

	public join(player: Player, kit?: Kit): GameJoinResult {
		this.addPlayer(player);
		player.setGameMode(GameMode.Adventure);
		const health: EntityHealthComponent | undefined = player.getComponent(
			EntityComponentTypes.Health,
		);
		if (health !== undefined) {
			health.resetToMaxValue();
		}
		clearEntityEffects(player);
		player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
			amplifier: 255,
			showParticles: false,
		});
		clearEntityEquippable(player);
		clearEntityInventory(player);
		if (kit !== undefined) {
			tools.kitManager.set(player, kit);
			player.sendMessage(`§7Selected Kit: ${kit.name}`);
		}
		player.teleport(this.spawn.pos, {
			dimension: this.dimension,
			facingLocation: this.spawn.facing,
		});
		return GameJoinResult.Success;
	}

	public leave(playerId: string): void {
		this.removePlayer(playerId);
		this._killTracker.removePlayer(playerId);
	}
}

const DIMENSION_ID: string = `${PACK_NAMESPACE}:kitpvp`;

system.beforeEvents.startup.subscribe((event: StartupEvent): void => {
	event.dimensionRegistry.registerCustomDimension(DIMENSION_ID);
});

world.afterEvents.worldLoad.subscribe(() => {
	kitPvpHubGameType.instances.push(
		new KitPvpHub(`${gameIds.kitPvpHub}-1`, world.getDimension(DIMENSION_ID)),
	);
});
