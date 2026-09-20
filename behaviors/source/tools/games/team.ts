import {
	GameMode,
	type Player,
	type PlayerLeaveBeforeEvent,
	type PlayerSpawnAfterEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { DEFAULT_CHATNAME_PREFIX } from "../../constants";
import { EventSignal, TeamDistributionMode, type TeleportLocation } from "../../types";
import { deathLocationTracker } from "../trackers/deathLocationTracker";

world.beforeEvents.playerLeave.subscribe((event: PlayerLeaveBeforeEvent) => {
	const team: Team | null = Team.findPlayer(event.player);
	if (team !== null) {
		system.run(() => {
			team.remove(event.player);
		});
	}
});

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

export interface TeamPlayerEliminationEvent {
	oldTeam: Team;
	player: Player;
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
					while (currentTeam.playerCount >= currentTeam.maxPlayers) {
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
	public onElimination: EventSignal<TeamPlayerEliminationEvent>;
	private _players: Set<Player>;
	private _isRespawning: Set<Player>;

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
		this.onElimination = new EventSignal<TeamPlayerEliminationEvent>();
		this._players = new Set<Player>();
		this._isRespawning = new Set<Player>();
	}

	public get playerCount(): number {
		return this._players.size;
	}

	public get players(): Player[] {
		return [...this._players];
	}

	public get displayName(): string {
		if (this._players.size === 1) {
			const player: Player | undefined = this._players.values().next().value;
			if (player !== undefined) {
				return `${this.colorCode}${player.name}§r`;
			}
		}
		return `${this.colorCode}${this.name} Team§r`;
	}

	public add(player: Player): boolean {
		if (this._players.size >= this.maxPlayers) {
			return false;
		}
		const oldTeam: Team | null = Team.findPlayer(player);
		if (oldTeam !== null) {
			oldTeam.remove(player);
		}
		this._players.add(player);
		Team._globalPlayers.set(player.id, this);
		player.nameTag = `${this.colorCode}${player.name}§r`;
		player.chatNamePrefix = this.colorCode;
		player.sendMessage(`§7Joined team: ${this.colorCode}${this.name}`);
		return true;
	}

	public remove(player: Player, triggerEvent = true): boolean {
		if (player.isValid) {
			player.nameTag = player.name;
			player.chatNamePrefix = DEFAULT_CHATNAME_PREFIX;
		}
		if (!this._players.delete(player)) {
			return false;
		}
		this._isRespawning.delete(player);
		Team._globalPlayers.delete(player.id);
		if (triggerEvent) {
			this.onElimination.triggerEvent({ oldTeam: this, player: player });
		}
		return true;
	}

	public clearPlayers(triggerEvents = false): void {
		for (const p of this._players) {
			this.remove(p, triggerEvents);
		}
	}

	public spawnPlayers(): void {
		for (const p of this._players) {
			p.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
			this.onSpawn.triggerEvent({ initialSpawn: true, player: p });
		}
	}

	public respawn(player: Player): void {
		if (this._isRespawning.has(player)) {
			return;
		}
		player.onScreenDisplay.setTitle("§cYOU DIED!");
		if (this.canRespawn && this.respawnTimeTicks === 0) {
			player.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
			this.onSpawn.triggerEvent({ initialSpawn: false, player: player });
			return;
		}
		const oldGameMode: GameMode = player.getGameMode();
		player.setGameMode(GameMode.Spectator);
		const deathLocation: Vector3 | null = deathLocationTracker(player);
		if (deathLocation !== null) {
			player.teleport(deathLocation);
		}
		if (!this.canRespawn) {
			this.remove(player);
			return;
		}
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
				this._isRespawning.delete(player);
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
		this._isRespawning.add(player);
	}
}
