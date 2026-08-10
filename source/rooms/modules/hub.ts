import type { Player } from "@minecraft/server";

export interface RoomHubConfig {
	onJoin?: (player: Player) => void;
	onLeave?: (player: Player) => void;
}

export class RoomHub {
	public readonly dimensionId: string;
	private _isActive: boolean;
	private _playerIds: Set<string>;
	private _onJoin: ((player: Player) => void) | null;
	private _onLeave: ((player: Player) => void) | null;

	constructor(
		dimensionId: string,
		onJoin: ((player: Player) => void) | null,
		onLeave: ((player: Player) => void) | null,
	) {
		this.dimensionId = dimensionId;
		this._isActive = true;
		this._playerIds = new Set<string>();
		this._onJoin = onJoin;
		this._onLeave = onLeave;
	}

	public get isActive(): boolean {
		return this._isActive;
	}

	public set isActive(val: boolean) {
		if (!val) {
			this._playerIds.clear();
		}
		this._isActive = val;
	}

	public has(player: Player): boolean {
		return this._playerIds.has(player.id);
	}

	public join(player: Player): void {
		if (!(player.isValid && this.isActive)) {
			return;
		}
		this._playerIds.add(player.id);
		if (this._onJoin !== null) {
			this._onJoin(player);
		}
	}

	public leave(player: Player): void {
		if (!this.isActive) {
			return;
		}
		if (this._onLeave !== null) {
			this._onLeave(player);
		}
		this.removePlayer(player);
	}

	public removePlayer(player: Player): void {
		this._playerIds.delete(player.id);
	}
}
