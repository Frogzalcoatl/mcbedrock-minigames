import { type Player, type PlayerSpawnAfterEvent, world } from "@minecraft/server";
import { PlayerManager } from "../playerManager";
import { ColorCode } from "../shared/colorCodes";
import { DyeColorId } from "../shared/dyeColorId";
import type { TeleportLocation } from "../shared/locations";
import { EliminationManager, type PlayerEliminationEvent } from "./eliminationManager";

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
	if (event.initialSpawn) {
		clearNameStyle(event.player);
	}
});

world.afterEvents.worldLoad.subscribe(() => {
	for (const p of world.getAllPlayers()) {
		clearNameStyle(p);
	}
});

export function clearNameStyle(player: Player): void {
	player.nameTag = player.name;
	player.chatNamePrefix = "";
	player.chatNameSuffix = "";
}

export class Team {
	public name: string;
	public maxPlayers: number;
	public colorCode: ColorCode;
	public dyeColor: DyeColorId;
	private readonly _activePlayers: PlayerManager;
	private readonly _eliminatedPlayers: PlayerManager;
	private _eliminationManager: EliminationManager | null;

	public constructor(name: string, maxPlayers: number) {
		this.name = name;
		this.maxPlayers = maxPlayers;
		this.colorCode = ColorCode.White;
		this.dyeColor = DyeColorId.White;
		this._activePlayers = new PlayerManager();
		this._eliminatedPlayers = new PlayerManager();
		this._eliminationManager = null;
	}

	public get displayName(): string {
		return `${this.colorCode}${this.name}§r`;
	}

	public get eliminationManager(): EliminationManager | null {
		return this._eliminationManager;
	}

	private handleElimination = (event: PlayerEliminationEvent): void => {
		if (event.player === null) {
			return;
		}
		this._activePlayers.remove(event.player);
		this._eliminatedPlayers.add(event.player);
	};

	public initEliminationManager(spawnPoint: TeleportLocation): void {
		this.removeEliminationManager();
		this._eliminationManager = new EliminationManager(spawnPoint);
		this._eliminationManager.onPlayerElimination.subscribe(this.handleElimination);
	}

	public removeEliminationManager(): void {
		if (this._eliminationManager !== null) {
			this._eliminationManager.shutdown();
			this._eliminationManager = null;
		}
	}

	public shutdown(): void {
		this._activePlayers.shutdown();
		this._eliminatedPlayers.shutdown();
		this.removeEliminationManager();
	}

	public join(player: Player): boolean {
		if (this._activePlayers.has(player) || this._activePlayers.size >= this.maxPlayers) {
			return false;
		}
		this._activePlayers.add(player);
		if (this._eliminationManager !== null) {
			this._eliminationManager.addPlayer(player);
		}
		player.nameTag = `${this.colorCode}${player.name}§r`;
		player.chatNamePrefix = this.colorCode;
		player.sendMessage(`§7Joined team: ${this.displayName}`);
		return true;
	}

	public leave(player: Player): boolean {
		if (!this._activePlayers.remove(player)) {
			return false;
		}
		if (this._eliminationManager !== null) {
			this._eliminationManager.removePlayer(player);
		}
		clearNameStyle(player);
		return true;
	}

	public reset(): void {
		this._activePlayers.clear();
		this._eliminatedPlayers.clear();
		if (this._eliminationManager !== null) {
			this._eliminationManager.clearPlayers();
		}
	}

	public getActivePlayers(): Player[] {
		return this._activePlayers.getAll();
	}

	public getEliminatedPlayers(): Player[] {
		return this._eliminatedPlayers.getAll();
	}
}
