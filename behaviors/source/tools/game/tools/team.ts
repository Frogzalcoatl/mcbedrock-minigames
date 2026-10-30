import {
	GameMode,
	type Player,
	type PlayerSpawnAfterEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { DEFAULT_CHATNAME_PREFIX } from "../../constants";
import { deathLocationTracker } from "../../helpers/deathLocationTracker";
import {
	arrRemoveByCallback,
	arrRemoveSwap,
	EventSignal,
	type TeleportLocation,
} from "../../types";

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
	if (event.initialSpawn) {
		resetPlayerName(event.player);
	}
});

world.afterEvents.worldLoad.subscribe(() => {
	for (const p of world.getAllPlayers()) {
		resetPlayerName(p);
	}
});

export function resetPlayerName(player: Player): void {
	player.nameTag = player.name;
	player.chatNamePrefix = DEFAULT_CHATNAME_PREFIX;
	player.chatNameSuffix = "";
}

export class Team {
	public colorCode: string;
	public maxPlayers: number;
	public name: string;
	public activePlayers: Player[];

	public constructor(name: string, maxPlayers: number) {
		this.colorCode = "§f";
		this.maxPlayers = maxPlayers;
		this.name = name;
		this.activePlayers = [];
	}

	public get displayName(): string {
		return `${this.colorCode}${this.name}§r`;
	}

	public join(player: Player): boolean {
		if (this.activePlayers.length >= this.maxPlayers || this.activePlayers.includes(player)) {
			return false;
		}
		this.activePlayers.push(player);
		player.nameTag = `${this.colorCode}${player.name}§r`;
		player.chatNamePrefix = this.colorCode;
		player.sendMessage(`§7Joined team: ${this.displayName}`);
		return true;
	}

	public leave(playerId: string): boolean {
		const removedPlayer: Player | undefined = arrRemoveByCallback(
			this.activePlayers,
			(p) => p.id === playerId,
		);
		if (removedPlayer?.isValid) {
			resetPlayerName(removedPlayer);
		}
		return removedPlayer !== undefined;
	}

	public reset(): void {
		this.activePlayers.length = 0;
	}
}

export interface PlayerEliminationEvent {
	player: Player;
	team: EliminatableTeam;
}

export class EliminatableTeam extends Team {
	public canRespawn: boolean;
	public respawnTimeTicks: number;
	public spawnPoint: TeleportLocation;
	public onSpawn: EventSignal<PlayerSpawnAfterEvent>;
	// Elimination events are still triggered when player.isValid is false
	public onPlayerElimination: EventSignal<PlayerEliminationEvent>;
	public onTeamElimination: EventSignal<EliminatableTeam>;
	public eliminatedPlayers: Player[];
	private _respawnIntervalIds: Map<string, number>; // key is playerId

	public constructor(name: string, spawnPoint: Vector3, maxPlayers: number) {
		super(name, maxPlayers);
		this.colorCode = "§f";
		this.maxPlayers = maxPlayers;
		this.name = name;
		this.canRespawn = false;
		this.respawnTimeTicks = 0;
		this.spawnPoint = {
			facing: {
				x: spawnPoint.x,
				y: spawnPoint.y,
				z: spawnPoint.z,
			},
			pos: spawnPoint,
		};
		this.onSpawn = new EventSignal<PlayerSpawnAfterEvent>();
		this.onPlayerElimination = new EventSignal<PlayerEliminationEvent>();
		this.onTeamElimination = new EventSignal<EliminatableTeam>();
		this.activePlayers = [];
		this.eliminatedPlayers = [];
		this._respawnIntervalIds = new Map<string, number>();
	}

	public override join(player: Player): boolean {
		if (this.activePlayers.length >= this.maxPlayers) {
			return false;
		}
		if (!(this.activePlayers.includes(player) || this.eliminatedPlayers.includes(player))) {
			this.activePlayers.push(player);
		}
		player.nameTag = `${this.colorCode}${player.name}§r`;
		player.chatNamePrefix = this.colorCode;
		player.sendMessage(`§7Joined team: ${this.colorCode}${this.name}`);
		return true;
	}

	public override leave(playerId: string): boolean {
		this.clearRespawnInterval(playerId);
		let removedPlayer: Player | undefined = arrRemoveByCallback(
			this.activePlayers,
			(p) => p.id === playerId,
		);
		if (removedPlayer !== undefined) {
			this.onPlayerElimination.triggerEvent({ player: removedPlayer, team: this });
			if (this.activePlayers.length === 0) {
				this.onTeamElimination.triggerEvent(this);
			}
			if (removedPlayer.isValid) {
				resetPlayerName(removedPlayer);
			}
			return true;
		}
		removedPlayer = arrRemoveByCallback(this.eliminatedPlayers, (p) => p.id === playerId);
		if (removedPlayer !== undefined) {
			if (removedPlayer.isValid) {
				resetPlayerName(removedPlayer);
			}
			return true;
		}
		return false;
	}

	public eliminate(player: Player): void {
		this.clearRespawnInterval(player.id);
		if (!arrRemoveSwap(this.activePlayers, player) || this.eliminatedPlayers.includes(player)) {
			return;
		}
		this.eliminatedPlayers.push(player);
		this.onPlayerElimination.triggerEvent({ player: player, team: this });
		if (this.activePlayers.length === 0) {
			this.onTeamElimination.triggerEvent(this);
		}
	}

	public override reset(): void {
		this.activePlayers.length = 0;
		this.eliminatedPlayers.length = 0;
		for (const [, id] of this._respawnIntervalIds) {
			system.clearRun(id);
		}
		this._respawnIntervalIds.clear();
	}

	public spawnPlayers(): void {
		for (const p of this.activePlayers) {
			p.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
			this.onSpawn.triggerEvent({ initialSpawn: true, player: p });
		}
	}

	public respawn(player: Player): void {
		if (this._respawnIntervalIds.has(player.id) || this.activePlayers.indexOf(player) === -1) {
			return;
		}
		if (!player.isValid) {
			this.eliminate(player);
			return;
		}
		player.onScreenDisplay.setTitle("§cYOU DIED!");
		const oldGameMode: GameMode = player.getGameMode();
		player.setGameMode(GameMode.Spectator);
		const deathLocation: Vector3 | null = deathLocationTracker(player);
		if (deathLocation !== null) {
			player.teleport(deathLocation);
		}
		if (!this.canRespawn) {
			this.eliminate(player);
			return;
		}
		if (this.respawnTimeTicks <= 0) {
			player.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
			this.onSpawn.triggerEvent({ initialSpawn: false, player: player });
			return;
		}
		let ticksRemaining = this.respawnTimeTicks;
		const intervalId: number = system.runInterval(() => {
			if (ticksRemaining <= 0) {
				if (player.isValid) {
					player.setGameMode(oldGameMode);
					player.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
					player.onScreenDisplay.setActionBar("§eYou will respawn in §c0§e seconds!");
					player.onScreenDisplay.setTitle("§aRESPAWNED!");
					this.onSpawn.triggerEvent({ initialSpawn: false, player: player });
				}
				system.clearRun(intervalId);
				this._respawnIntervalIds.delete(player.id);
				return;
			}
			if (player.isValid) {
				const secondsRemaining = Math.ceil(ticksRemaining / 20);
				player.onScreenDisplay.setActionBar(
					`§eYou will respawn in §c${secondsRemaining}§e second${secondsRemaining !== 1 ? "s" : ""}!`,
				);
			}
			ticksRemaining--;
		});
		this._respawnIntervalIds.set(player.id, intervalId);
	}

	private clearRespawnInterval(playerId: string): void {
		const id: number | undefined = this._respawnIntervalIds.get(playerId);
		if (id !== undefined) {
			system.clearRun(id);
			this._respawnIntervalIds.delete(playerId);
		}
	}
}
