import {
	GameMode,
	type Player,
	type PlayerSpawnAfterEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { DEFAULT_CHATNAME_PREFIX } from "../../constants";
import {
	arrRemoveSwap,
	EventSignal,
	TeamDistributionMode,
	type TeleportLocation,
} from "../../types";
import { deathLocationTracker } from "../trackers/deathLocationTracker";

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
	if (event.initialSpawn) {
		event.player.nameTag = event.player.name;
		event.player.chatNamePrefix = DEFAULT_CHATNAME_PREFIX;
	} else {
		const team: Team | null = Team.findPlayer(event.player);
		if (team !== null) {
			team.respawn(event.player);
		}
	}
});

world.afterEvents.worldLoad.subscribe(() => {
	for (const p of world.getAllPlayers()) {
		p.nameTag = p.name;
		p.chatNamePrefix = DEFAULT_CHATNAME_PREFIX;
	}
});

export interface TeamEliminationEvent {
	player: Player;
	team: Team;
}

export class Team {
	private static _globalPlayers = new Map<string, Team>();

	public static findPlayer(player: Player): Team | null {
		return Team._globalPlayers.get(player.id) ?? null;
	}

	public static distribute(
		teams: Team[],
		players: Player[],
		mode: TeamDistributionMode = TeamDistributionMode.Balanced,
	): void {
		if (teams.length < 1) {
			return;
		}
		switch (mode) {
			case TeamDistributionMode.Balanced: {
				break;
			}
			case TeamDistributionMode.InOrder: {
				let i = 0;
				let currentTeam: Team | undefined = teams[i];
				if (currentTeam === undefined) {
					return;
				}
				for (const p of players) {
					if (Team._globalPlayers.has(p.id)) {
						continue;
					}
					while (currentTeam.activePlayers.length >= currentTeam.maxPlayers) {
						currentTeam = teams[++i];
						if (currentTeam === undefined) {
							return;
						}
					}
					currentTeam.add(p);
				}
				break;
			}
			default:
				break;
		}
	}

	public canRespawn: boolean;
	public colorCode: string;
	public maxPlayers: number;
	public name: string;
	public respawnTimeTicks: number;
	public spawnPoint: TeleportLocation;
	public onSpawn: EventSignal<PlayerSpawnAfterEvent>;
	// Elimination events are still triggered when player.isValid is false
	public onElimination: EventSignal<TeamEliminationEvent>;
	public activePlayers: Player[];
	public eliminatedPlayers: Player[];
	private _isRespawning: Player[];

	public constructor(name: string, spawnPoint: Vector3, maxPlayers: number) {
		this.canRespawn = false;
		this.colorCode = "§f";
		this.maxPlayers = maxPlayers;
		this.name = name;
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
		this.onElimination = new EventSignal<TeamEliminationEvent>();
		this.activePlayers = [];
		this.eliminatedPlayers = [];
		this._isRespawning = [];
	}

	public get displayName(): string {
		if (this.maxPlayers === 1) {
			const player: Player | undefined = this.activePlayers[0];
			if (player !== undefined) {
				return `${this.colorCode}${player.name}§r`;
			}
		}
		return `${this.colorCode}${this.name}§r`;
	}

	public add(player: Player): boolean {
		if (this.activePlayers.length >= this.maxPlayers) {
			return false;
		}
		const oldTeam: Team | null = Team.findPlayer(player);
		if (oldTeam !== null) {
			oldTeam.remove(player);
		}
		if (!this.activePlayers.includes(player)) {
			this.activePlayers.push(player);
		}
		Team._globalPlayers.set(player.id, this);
		player.nameTag = `${this.colorCode}${player.name}§r`;
		player.chatNamePrefix = this.colorCode;
		player.sendMessage(`§7Joined team: ${this.colorCode}${this.name}`);
		return true;
	}

	public eliminate(player: Player): void {
		if (!arrRemoveSwap(this.activePlayers, player)) {
			return;
		}
		if (!this.eliminatedPlayers.includes(player)) {
			this.eliminatedPlayers.push(player);
			this.onElimination.triggerEvent({ player: player, team: this });
		}
	}

	public remove(player: Player, triggerEliminationEvent = true): boolean {
		if (player.isValid) {
			player.nameTag = player.name;
			player.chatNamePrefix = DEFAULT_CHATNAME_PREFIX;
		}
		if (
			!(
				arrRemoveSwap(this.activePlayers, player) ||
				arrRemoveSwap(this.eliminatedPlayers, player) ||
				arrRemoveSwap(this._isRespawning, player)
			)
		) {
			return false;
		}
		Team._globalPlayers.delete(player.id);
		if (triggerEliminationEvent) {
			this.onElimination.triggerEvent({ player: player, team: this });
		}
		return true;
	}

	public clearPlayers(triggerEvents = false): void {
		for (const p of this.activePlayers) {
			this.remove(p, triggerEvents);
		}
	}

	public spawnPlayers(): void {
		for (const p of this.activePlayers) {
			p.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
			this.onSpawn.triggerEvent({ initialSpawn: true, player: p });
		}
	}

	public respawn(player: Player): void {
		if (this._isRespawning.includes(player)) {
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
		if (this.respawnTimeTicks === 0) {
			player.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
			this.onSpawn.triggerEvent({ initialSpawn: false, player: player });
			return;
		}
		this._isRespawning.push(player);
		const respawnTimeTicks: number = this.respawnTimeTicks;
		let secondsRemaining: number = respawnTimeTicks / 20;
		let ticks = 0;
		const intervalId: number = system.runInterval(() => {
			if (ticks >= respawnTimeTicks) {
				if (player.isValid) {
					player.setGameMode(oldGameMode);
					player.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
					player.onScreenDisplay.setActionBar("§eYou will respawn in §c0§e seconds!");
					player.onScreenDisplay.setTitle("§aRESPAWNED!");
					this.onSpawn.triggerEvent({ initialSpawn: false, player: player });
				}
				system.clearRun(intervalId);
				arrRemoveSwap(this._isRespawning, player);
				return;
			}
			if (player.isValid) {
				secondsRemaining = Math.ceil((respawnTimeTicks - ticks) / 20);
				player.onScreenDisplay.setActionBar(
					`§eYou will respawn in §c${secondsRemaining}§e second${secondsRemaining !== 1 ? "s" : ""}!`,
				);
			}
			ticks++;
		});
	}
}
