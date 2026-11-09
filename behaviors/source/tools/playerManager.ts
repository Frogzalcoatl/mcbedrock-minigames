import { type Entity, Player, type PlayerLeaveAfterEvent, world } from "@minecraft/server";
import { EventSignal } from "./shared/eventSignal";

export class PlayerManager {
	public readonly onDisconnect: EventSignal<PlayerLeaveAfterEvent>;
	private readonly _playerIds: Set<string>;
	private _isInitialized: boolean;

	public constructor() {
		this.onDisconnect = new EventSignal();
		this._playerIds = new Set();
		this._isInitialized = false;
	}

	public get size(): number {
		return this._playerIds.size;
	}

	public get isEmpty(): boolean {
		return this._playerIds.size === 0;
	}

	public add(player: Player): void {
		this._playerIds.add(player.id);
		if (!this._isInitialized) {
			this.init();
		}
	}

	private resolveId(target: Player | string): string {
		return typeof target === "string" ? target : target.id;
	}

	public remove(player: Player | string): boolean {
		const id: string = this.resolveId(player);
		if (!this._playerIds.delete(id)) {
			return false;
		}
		if (this._playerIds.size === 0) {
			this.shutdown();
		}
		return true;
	}

	public has(player: Player | string): boolean {
		const id: string = this.resolveId(player);
		return this._playerIds.has(id);
	}

	public clear(): void {
		this._playerIds.clear();
		this.shutdown();
	}

	public getAll(): Player[] {
		const players: Player[] = [];
		for (const id of this._playerIds) {
			const entity: Entity | undefined = world.getEntity(id);
			if (entity instanceof Player && entity.isValid) {
				players.push(entity);
			} // If false, player is in the process of being cleaned up by the PlayerLeaveAfterEvent
		}
		return players;
	}

	private handleDisconnect = (event: PlayerLeaveAfterEvent): void => {
		if (!this._playerIds.delete(event.playerId)) {
			return;
		}
		if (this._playerIds.size === 0) {
			this.shutdown();
		}
		this.onDisconnect.triggerEvent(event);
	};

	private init(): void {
		if (!this._isInitialized) {
			world.afterEvents.playerLeave.subscribe(this.handleDisconnect);
			this._isInitialized = true;
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.playerLeave.unsubscribe(this.handleDisconnect);
			this._isInitialized = false;
		}
	}
}
