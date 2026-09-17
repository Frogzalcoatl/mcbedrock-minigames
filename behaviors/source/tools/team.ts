import {
	GameMode,
	type Player,
	type PlayerLeaveBeforeEvent,
	type PlayerSpawnAfterEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { EventSignal, type PlayerEvent, type TeleportLocation } from "../types";
import { deathLocationTracker } from "./trackers/deathLocationTracker";

world.beforeEvents.playerLeave.subscribe((event: PlayerLeaveBeforeEvent) => {
	const team: Team | null = Team.find(event.player);
	if (team !== null) {
		system.run(() => {
			team.remove(event.player);
		});
	}
});

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
	const team: Team | null = Team.find(event.player);
	if (team !== null) {
		team.respawn(event.player);
	}
});

world.afterEvents.worldLoad.subscribe(() => {
	for (const p of world.getAllPlayers()) {
		p.nameTag = p.name;
		p.chatNamePrefix = "";
	}
});

export class Team {
	private static _globalPlayers = new Map<string, Team>();

	public static find(player: Player): Team | null {
		return Team._globalPlayers.get(player.id) ?? null;
	}

	public canRespawn: boolean;
	public colorCode: string;
	public maxPlayers: number;
	public name: string;
	public respawnTimeTicks: number;
	public spawnPoint: TeleportLocation;
	public onRespawn: EventSignal<PlayerEvent>;
	// Elimination events are still triggered when player.isValid is false
	public onElimination: EventSignal<PlayerEvent>;
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
		this.onRespawn = new EventSignal<PlayerEvent>();
		this.onElimination = new EventSignal<PlayerEvent>();
		this._players = new Set<Player>();
		this._isRespawning = new Set<Player>();
	}

	public add(player: Player): boolean {
		if (this._players.size >= this.maxPlayers) {
			return false;
		}
		const oldTeam: Team | null = Team.find(player);
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
		if (triggerEvent) {
			this.onElimination.triggerEvent({ player: player });
		}
		if (player.isValid) {
			player.nameTag = player.name;
			player.chatNamePrefix = "";
		}
		if (this._players.delete(player)) {
			this._isRespawning.delete(player);
			Team._globalPlayers.delete(player.id);
			return true;
		}
		return false;
	}

	public resetPlayers(triggerEvents = false): void {
		for (const p of this._players) {
			this.remove(p, triggerEvents);
		}
	}

	public respawn(player: Player): void {
		if (!this.canRespawn) {
			this.remove(player);
			return;
		}
		if (this.respawnTimeTicks === 0) {
			player.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
			this.onRespawn.triggerEvent({ player: player });
			return;
		}
		if (this._isRespawning.has(player)) {
			return;
		}
		const deathLocation: Vector3 | null = deathLocationTracker(player);
		if (deathLocation !== null) {
			player.teleport(deathLocation);
		}
		player.onScreenDisplay.setTitle("§cYOU DIED!");
		const oldGameMode: GameMode = player.getGameMode();
		player.setGameMode(GameMode.Spectator);
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
					this.onRespawn.triggerEvent({ player: player });
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
