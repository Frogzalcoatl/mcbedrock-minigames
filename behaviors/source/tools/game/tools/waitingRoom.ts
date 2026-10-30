import { type Player, system } from "@minecraft/server";
import { playerNameTracker } from "../../helpers/playerNameTracker";
import { arrRemoveByCallback, EventSignal, WaitingRoomState } from "../../types";

export class WaitingRoom {
	public readonly players: Player[];

	// Amount of players required to start the countdown
	public playersToStart: number;

	// Minimum amount of players required to start the game.
	// Should be less than or equal to playersToStart
	public minPlayers: number;

	// Maximum amount of players allowed
	public maxPlayers: number;

	// Length of countdown
	public startTimeSeconds: number;

	// Seconds remaining to start the game
	public secondsRemaining: number;

	// Event triggers when countdown finishes
	public onStart: EventSignal<Player[]>;

	// 1 second runInterval for countdown
	private _intervalId: number | null;

	// self explanatory
	private _state: WaitingRoomState;

	public constructor(
		playersToStart: number,
		minPlayers: number,
		maxPlayers: number,
		startTimeSeconds = 30,
	) {
		this.players = [];
		this.playersToStart = playersToStart;
		this.minPlayers = minPlayers;
		this.maxPlayers = maxPlayers;
		this.startTimeSeconds = startTimeSeconds;
		this.secondsRemaining = startTimeSeconds;
		this.onStart = new EventSignal<Player[]>();
		this._intervalId = null;
		this._state = WaitingRoomState.Open;
	}

	public get state(): WaitingRoomState {
		return this._state;
	}

	private startInterval(): void {
		this.clearInterval();
		const playSoundDuring: number[] = [60, 39, 29, 10, 5, 4, 3, 2, 1];
		if (!playSoundDuring.includes(this.startTimeSeconds)) {
			playSoundDuring.push(this.startTimeSeconds);
		}
		this.secondsRemaining = this.startTimeSeconds;
		const intervalId: number = system.runInterval(() => {
			if (this.players.length < this.minPlayers) {
				this.secondsRemaining = this.startTimeSeconds;
				const playersNeeded: number = this.playersToStart - this.players.length;
				for (const p of this.players) {
					p.onScreenDisplay.setActionBar(
						`Waiting for §l${playersNeeded}§r more player${playersNeeded !== 1 ? "s" : ""}...`,
					);
				}
				return;
			}
			if (this.secondsRemaining <= 0) {
				system.clearRun(intervalId);
				this._intervalId = null;
				this.onStart.triggerEvent(this.players);
				return;
			}
			for (const p of this.players) {
				p.onScreenDisplay.setActionBar(
					`Game starting in §l${this.secondsRemaining}§r second${this.secondsRemaining !== 1 ? "s" : ""}`,
				);
			}
			if (playSoundDuring.includes(this.secondsRemaining)) {
				for (const p of this.players) {
					p.playSound("random.click");
				}
			}
			this.secondsRemaining--;
		}, 20);
		this._intervalId = intervalId;
	}

	private clearInterval(): void {
		if (this._intervalId !== null) {
			system.clearRun(this._intervalId);
		}
	}

	public addPlayer(player: Player): boolean {
		if (this._state !== WaitingRoomState.Open) {
			let message = `§cWaiting room is `;
			message += this._state === WaitingRoomState.Closed ? "closed" : "full";
			player.sendMessage(message);
			return false;
		}
		if (this.players.includes(player)) {
			return false;
		}
		this.players.push(player);
		if (this._intervalId === null) {
			this.startInterval();
		}
		const message: string = `§7${player.name}§r§7 joined the game §8[${this.players.length}/${this.maxPlayers}]`;
		for (const p of this.players) {
			p.sendMessage(message);
		}
		return true;
	}

	public removePlayer(playerId: string): void {
		arrRemoveByCallback(this.players, (p) => p.id === playerId);
		if (this.players.length === 0 && this._intervalId !== null) {
			system.clearRun(this._intervalId);
			this._intervalId = null;
		} else {
			const message: string = `§7${playerNameTracker(playerId)}§r§7 left the game`;
			for (const p of this.players) {
				p.sendMessage(message);
			}
		}
	}
}
