/** biome-ignore-all lint/style/useNamingConvention: using enum title casing in an object */

import { type Player, type PlayerLeaveAfterEvent, system } from "@minecraft/server";
import { PlayerManager } from "./playerManager";
import { EventSignal } from "./shared/eventSignal";

// biome-ignore assist/source/useSortedKeys: Maintaining order since this is an enum
export const WaitingRoomState = {
	Closed: 0,
	Open: 1,
	Full: 2,
} as const;
export type WaitingRoomState = (typeof WaitingRoomState)[keyof typeof WaitingRoomState];

export function waitingRoomStateToString(state: WaitingRoomState): string {
	switch (state) {
		case WaitingRoomState.Closed:
			return "Closed";
		case WaitingRoomState.Open:
			return "Open";
		case WaitingRoomState.Full:
			return "Full";
		default:
			return "Unknown";
	}
}

export interface WaitingRoomJoinEvent {
	player: Player;
	room: WaitingRoom;
}

export interface WaitingRoomLeaveEvent {
	playerId: string;
	playerName: string;
	room: WaitingRoom;
}

export interface WaitingRoomConfig {
	countdownDurationSeconds: number;
	maxPlayersForCompletion: number;
	minPlayersForCompletion: number;
	playersToStartCountdown: number;
}

export class WaitingRoom {
	public playersToStartCountdown: number;

	public minPlayersForCompletion: number;

	public maxPlayersForCompletion: number;

	public countdownDurationSeconds: number;

	public secondsRemaining: number;

	public readonly onPlayerJoin: EventSignal<WaitingRoomJoinEvent>;

	public readonly onPlayerLeave: EventSignal<WaitingRoomLeaveEvent>;

	public readonly onWaitingTick: EventSignal<WaitingRoom>;

	public readonly onCountdownTick: EventSignal<WaitingRoom>;

	public readonly onCountdownCancelled: EventSignal<WaitingRoom>;

	public readonly onCountdownComplete: EventSignal<WaitingRoom>;

	private readonly _players: PlayerManager;

	private _waitingIntervalId: number | null;

	private _countdownIntervalId: number | null;

	private _state: WaitingRoomState;

	public constructor(config: WaitingRoomConfig) {
		this.playersToStartCountdown = config.playersToStartCountdown;
		this.minPlayersForCompletion = config.minPlayersForCompletion;
		this.maxPlayersForCompletion = config.maxPlayersForCompletion;
		this.countdownDurationSeconds = config.countdownDurationSeconds;
		this.secondsRemaining = config.countdownDurationSeconds;
		this.onPlayerJoin = new EventSignal();
		this.onPlayerLeave = new EventSignal();
		this.onWaitingTick = new EventSignal();
		this.onCountdownTick = new EventSignal();
		this.onCountdownCancelled = new EventSignal();
		this.onCountdownComplete = new EventSignal();
		this._players = new PlayerManager();
		this._players.onDisconnect.subscribe(this.handleDisconnect);
		this._waitingIntervalId = null;
		this._countdownIntervalId = null;
		this._state = WaitingRoomState.Open;
	}

	public get state(): WaitingRoomState {
		return this._state;
	}

	private handleDisconnect = (event: PlayerLeaveAfterEvent): void => {
		this.onPlayerLeave.triggerEvent({
			playerId: event.playerId,
			playerName: event.playerName,
			room: this,
		});
	};

	private stopWaitingTick(): void {
		if (this._waitingIntervalId !== null) {
			system.clearRun(this._waitingIntervalId);
			this._waitingIntervalId = null;
		}
	}

	private startWaitingTick(): void {
		this.stopWaitingTick();
		this._waitingIntervalId = system.runInterval(this.waitingTick, 20);
	}

	private stopCountdownTick(): void {
		if (this._countdownIntervalId !== null) {
			system.clearRun(this._countdownIntervalId);
			this._countdownIntervalId = null;
		}
	}

	private startCountdownTick(): void {
		this.stopCountdownTick();
		this._countdownIntervalId = system.runInterval(this.countdownTick, 20);
	}

	private updateFullState(): void {
		if (this._state === WaitingRoomState.Closed) {
			return;
		}
		this._state =
			this._players.size >= this.maxPlayersForCompletion
				? WaitingRoomState.Full
				: WaitingRoomState.Open;
	}

	private waitingTick = (): void => {
		this.updateFullState();
		if (this._players.size >= this.playersToStartCountdown) {
			this.stopWaitingTick();
			this.startCountdownTick();
		} else {
			this.onWaitingTick.triggerEvent(this);
		}
	};

	private countdownTick = (): void => {
		this.updateFullState();
		if (this._players.size < this.playersToStartCountdown) {
			this.secondsRemaining = this.countdownDurationSeconds;
			this.stopCountdownTick();
			this.onCountdownCancelled.triggerEvent(this);
			if (this._players.size > 0) {
				this.startWaitingTick();
			}
			return;
		}
		if (this.secondsRemaining <= 0) {
			this.stopCountdownTick();
			this._state = WaitingRoomState.Closed;
			this.onCountdownComplete.triggerEvent(this);
			return;
		}
		this.onCountdownTick.triggerEvent(this);
		this.secondsRemaining--;
	};

	public join(player: Player): boolean {
		if (this._state !== WaitingRoomState.Open || this._players.has(player)) {
			return false;
		}
		this._players.add(player);
		this.updateFullState();
		this.onPlayerJoin.triggerEvent({ player: player, room: this });
		if (this._waitingIntervalId === null && this._countdownIntervalId === null) {
			this.startWaitingTick();
		}
		return true;
	}

	public leave(player: Player): void {
		this._players.remove(player);
		if (this._players.size === 0) {
			this.stopCountdownTick();
			this.stopWaitingTick();
		}
		this.updateFullState();
		this.onPlayerLeave.triggerEvent({
			playerId: player.id,
			playerName: player.name,
			room: this,
		});
	}

	public reset(): void {
		this.stopCountdownTick();
		this.stopWaitingTick();
		this.secondsRemaining = this.countdownDurationSeconds;
		this._players.clear();
		this._state = WaitingRoomState.Open;
	}

	public getPlayers(): Player[] {
		return this._players.getAll();
	}

	public has(player: Player): boolean {
		return this._players.has(player);
	}

	public shutdown(): void {
		if (this._waitingIntervalId !== null) {
			system.clearRun(this._waitingIntervalId);
			this._waitingIntervalId = null;
		}
		if (this._countdownIntervalId !== null) {
			system.clearRun(this._countdownIntervalId);
			this._countdownIntervalId = null;
		}
	}
}
