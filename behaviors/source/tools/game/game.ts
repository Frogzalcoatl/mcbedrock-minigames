import {
	type Dimension,
	EntityComponentTypes,
	type EntityInventoryComponent,
	GameMode,
	type Player,
	system,
	type Vector3,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { roomTypeIds } from "../../constants";
import { itemLeaveGame } from "../../items/games/leaveGame";
import {
	arrRemoveSwap,
	EventSignal,
	GameState,
	gameStateToString,
	TeamDistributionMode,
} from "../../types";
import {
	clearEntityEffects,
	clearEntityEquippable,
	clearEntityInventory,
	hubEffectHelper,
} from "../componentHelpers";
import type { Room, RoomBeforeJoinEvent } from "../room/room";
import { RoomType } from "../room/roomType";
import { type PlayerEliminationEvent, Team } from "./team";
import { getPlayerName } from "./textFormatting";

interface TeamOrdersValue {
	colorCode: string;
	name: string;
}

const teamOrders: TeamOrdersValue[] = [
	{ colorCode: "§c", name: "Red" },
	{ colorCode: "§1", name: "Blue" },
	{ colorCode: "§a", name: "Green" },
	{ colorCode: "§e", name: "Yellow" },
	{ colorCode: "§3", name: "Aqua" },
	{ colorCode: "§f", name: "White" },
	{ colorCode: "§d", name: "Pink" },
	{ colorCode: "§8", name: "Gray" },
];

export interface GameJoinEvent {
	game: Game;
	player: Player;
}

export interface GameEliminationEvent {
	game: Game;
	player: Player;
	team: Team;
}

export interface GameConfig {
	maxPlayers: number;
	playersPerTeam: number;
	playersToStart: number;
	room: Room;
	spectatorPos: Vector3;
	teamCount: number;
}

export class Game {
	private static _globalPlayers = new Map<string, Game>();

	public static findPlayer(player: Player): Game | undefined {
		return Game._globalPlayers.get(player.id);
	}

	private static _games = new Map<string, Game>(); // key is dimensionId

	public static get(dimensionId: string): Game | undefined {
		return Game._games.get(dimensionId);
	}

	public readonly room: Room;
	public readonly teams: Team[];

	public readonly playersToStart: number;
	public readonly maxPlayers: number;
	public readonly playersPerTeam: number;

	public spectatorPos: Vector3;

	public secondsRemaining: number;
	public startTimeSeconds: number;
	public gameDurationSeconds: number;

	// You should set this.state to GameState.Open when complete
	public resetGame: ((game: Game) => void) | null;

	public readonly onStart: EventSignal<Game>;
	public readonly whileActive: EventSignal<Game>;
	public readonly onElimination: EventSignal<GameEliminationEvent>;

	// You should set this.state to GameState.Resetting when complete
	public endGame: ((game: Game) => void) | null;

	public players: Player[];
	public spectators: Player[];
	private _state: GameState;
	private _openIntervalId: number | null;
	private _activeIntervalId: number | null;

	public constructor(config: GameConfig) {
		Game._games.set(config.room.dimensionId, this);
		this.room = config.room;
		this.teams = [];
		this.playersToStart = config.playersToStart;
		this.maxPlayers = config.maxPlayers;
		this.playersPerTeam = config.playersPerTeam;
		this.spectatorPos = config.spectatorPos;
		this.secondsRemaining = 0;
		this.startTimeSeconds = 20;
		this.gameDurationSeconds = 300; // 5 Minutes
		this.resetGame = null;
		this.onStart = new EventSignal<Game>();
		this.whileActive = new EventSignal<Game>();
		this.onElimination = new EventSignal<GameEliminationEvent>();
		this.endGame = null;
		this.players = [];
		this.spectators = [];
		this._state = GameState.Resetting;
		this._openIntervalId = null;
		this._activeIntervalId = null;
		this.room.beforeJoin.subscribe(this.beforeJoin);
		this.room.onJoin.subscribe(this.roomOnJoin);
		this.room.onLeave.subscribe(this.roomOnLeave);
		let teamsAdded = 0;
		for (let i = 0; i < Math.min(config.teamCount, teamOrders.length); i++) {
			const current: TeamOrdersValue | undefined = teamOrders[i];
			if (current !== undefined) {
				const team = new Team(current.name, { x: 0.5, y: 0, z: 0.5 }, config.playersPerTeam);
				team.colorCode = current.colorCode;
				this.teams.push(team);
				teamsAdded++;
			}
		}
		if (teamsAdded < config.teamCount) {
			const remaining: number = config.teamCount - teamsAdded;
			for (let i = 1; i <= remaining; i++) {
				this.teams.push(
					new Team(`Extra-${i}`, { x: 0.5, y: 0, z: 0.5 }, config.playersPerTeam),
				);
			}
		}
		for (const t of this.teams) {
			t.onElimination.subscribe(this.teamEliminationCallback);
		}
	}

	public get state(): GameState {
		return this._state;
	}

	public set state(newState: GameState) {
		if (this._openIntervalId !== null) {
			system.clearRun(this._openIntervalId);
			this._openIntervalId = null;
		}
		if (this._activeIntervalId !== null) {
			system.clearRun(this._activeIntervalId);
			this._activeIntervalId = null;
		}
		this._state = newState;
		switch (newState) {
			case GameState.Resetting: {
				this.clearPlayers();
				if (this.resetGame === null) {
					this._state = GameState.Open;
				} else {
					this.resetGame(this);
				}
				break;
			}
			case GameState.Open: {
				if (this.players.length > 0) {
					this.whileOpen();
				}
				break;
			}
			case GameState.Active: {
				this.startGame();
				break;
			}
			case GameState.Ending: {
				this.winMessage();
				if (this.endGame === null) {
					this.state = GameState.Resetting;
				} else {
					this.endGame(this);
				}
				break;
			}
			default:
				break;
		}
	}

	public get teamsRemaining(): number {
		let remaining = 0;
		for (const t of this.teams) {
			if (t.activePlayers.length > 0) {
				remaining++;
			}
		}
		return remaining;
	}

	public sendMessage(message: string): void {
		for (const p of this.players) {
			p.sendMessage(message);
		}
		for (const s of this.spectators) {
			s.sendMessage(message);
		}
	}

	public setActionBar(text: string): void {
		for (const p of this.players) {
			p.onScreenDisplay.setActionBar(text);
		}
		for (const s of this.spectators) {
			s.onScreenDisplay.setActionBar(text);
		}
	}

	public addSpectator(player: Player): void {
		const dimension: Dimension | undefined = this.room.dimension;
		if (dimension === undefined) {
			player.sendMessage("§cUnable to join due to invalid dimension");
			return;
		}
		clearEntityEffects(player);
		clearEntityInventory(player);
		clearEntityEquippable(player);
		player.setGameMode(GameMode.Spectator);
		system.runTimeout(() => player.teleport(this.spectatorPos, { dimension: dimension }), 5);
		if (!this.spectators.includes(player)) {
			this.spectators.push(player);
		}
		this.sendMessage(`${getPlayerName(player)}§r§7 is spectating`);
	}

	public clearPlayers(): void {
		const hubRoomType: RoomType | undefined = RoomType.get(roomTypeIds.hub);
		for (const t of this.teams) {
			t.clearPlayers(false);
		}
		if (hubRoomType !== undefined) {
			for (const p of this.players) {
				hubRoomType.queue(p);
			}
			for (const s of this.spectators) {
				hubRoomType.queue(s);
			}
		}
		this.spectators.length = 0;
		this.players.length = 0;
	}

	public info(): string {
		let info = `
Game:
State: §e${gameStateToString(this._state)}§r
Active Players: §e${this.players.length}/${this.maxPlayers}§r
Spectators: §e${this.spectators.length}§r
Game Duration: §e${this.gameDurationSeconds}s§r`.trimStart();
		if (this._openIntervalId !== null || this._activeIntervalId !== null) {
			info += `\nTime Remaining: §e${this.secondsRemaining}s§r`;
		}
		info += `
Teams: §e${this.teams.length}§r
Players Per Team: §e${this.playersPerTeam}§r`;
		if (this._state === GameState.Active) {
			info += `\nTeams Remaining: §e${this.teamsRemaining}§r`;
		}
		info += `

Interval Ids:
Open: §e${this._openIntervalId}§r
Active: §e${this._activeIntervalId}§r
`;
		return info;
	}

	private whileOpen(): void {
		if (this._openIntervalId !== null) {
			system.clearRun(this._openIntervalId);
			this._openIntervalId = null;
		}
		const playSoundDuring: number[] = [60, 30, 20, 10, 5, 4, 3, 2, 1];
		if (!playSoundDuring.includes(this.startTimeSeconds)) {
			playSoundDuring.push(this.startTimeSeconds);
		}
		this.secondsRemaining = this.startTimeSeconds;
		const intervalId: number = system.runInterval(() => {
			if (this.players.length < this.playersToStart) {
				this.secondsRemaining = this.startTimeSeconds;
				const playersNeeded: number = this.playersToStart - this.players.length;
				this.setActionBar(
					`Waiting for §l${playersNeeded}§r more player${playersNeeded !== 1 ? "s" : ""}...`,
				);
				return;
			}
			if (this.secondsRemaining <= 0) {
				system.clearRun(intervalId);
				this.state = GameState.Active;
				return;
			}
			this.setActionBar(`Game starting in §l${Math.ceil(this.secondsRemaining)} §rseconds`);
			if (playSoundDuring.includes(this.secondsRemaining)) {
				for (const p of this.players) {
					p.playSound("random.click");
				}
				for (const s of this.spectators) {
					s.playSound("random.click");
				}
			}
			this.secondsRemaining -= 1;
		}, 20);
		this._openIntervalId = intervalId;
	}

	private startGame(): void {
		Team.distribute(this.teams, this.players, TeamDistributionMode.InOrder);
		for (const t of this.teams) {
			t.spawnPlayers();
		}
		for (const p of this.players) {
			p.removeEffect(MinecraftEffectTypes.Weakness);
		}
		system.runTimeout(() => {
			for (const p of this.players) {
				p.playSound("random.orb");
			}
			for (const s of this.spectators) {
				s.teleport(this.spectatorPos);
				s.playSound("random.orb");
			}
		}, 1);
		this.secondsRemaining = this.gameDurationSeconds;
		this.onStart.triggerEvent(this);
		if (this._activeIntervalId !== null) {
			system.clearRun(this._activeIntervalId);
			this._activeIntervalId = null;
		}
		const intervalId: number = system.runInterval(() => {
			this.secondsRemaining--;
			if (this.secondsRemaining <= 0) {
				this.sendMessage("§cGame has run out of time and ended.");
				this.state = GameState.Ending;
				system.clearRun(intervalId);
				this._activeIntervalId = null;
				return;
			}
			this.whileActive.triggerEvent(this);
		}, 20);
		this._activeIntervalId = intervalId;
	}

	private winMessage(): void {
		for (const t of this.teams) {
			if (t.activePlayers.length === 0) {
				continue;
			}
			this.sendMessage(`${t.displayName} §awon the game!`);
			for (const p of t.activePlayers) {
				p.playSound("random.levelup");
				p.onScreenDisplay.setTitle("§6VICTORY!");
			}
		}
	}

	// Arrow functions because they seem to maintain context of "this"

	private beforeJoin = (event: RoomBeforeJoinEvent): void => {
		switch (this._state) {
			case GameState.Resetting: {
				event.player.sendMessage("§cUnable to join game: Game is resetting");
				event.cancel = true;
				break;
			}
			case GameState.Open: {
				if (this.players.length >= this.maxPlayers) {
					event.player.sendMessage("§cUnable to join game: Game is full");
					event.cancel = true;
				}
				break;
			}
			case GameState.Ending: {
				event.player.sendMessage("§cUnable to join game: Game is ending");
				event.cancel = true;
				break;
			}
			default:
				break;
		}
	};

	private roomOnJoin = (player: Player): void => {
		if (this._state !== GameState.Open || this.players.length >= this.maxPlayers) {
			this.addSpectator(player);
			return;
		}
		if (!this.players.includes(player)) {
			this.players.push(player);
		}
		if (this.players.length === 1) {
			this.whileOpen();
		}
		hubEffectHelper(player);
		player.setGameMode(GameMode.Adventure);
		clearEntityEquippable(player);
		const inventory: EntityInventoryComponent | undefined = player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			inventory.container.clearAll();
			inventory.container.setItem(8, itemLeaveGame());
		}
		this.sendMessage(
			`${getPlayerName(player)}§r§7 joined the game §8[${this.players.length}/${this.maxPlayers}]`,
		);
	};

	private roomOnLeave = (player: Player): void => {
		const team: Team | null = Team.findPlayer(player);
		if (team !== null) {
			team.remove(player, this._state === GameState.Active);
		}
		arrRemoveSwap(this.players, player);
		arrRemoveSwap(this.spectators, player);
		const leaveMessage: string = `${getPlayerName(player)}§r§7 left the game`;
		if (this._state !== GameState.Open) {
			this.sendMessage(leaveMessage);
			return;
		}
		if (this.players.length === 0 && this._openIntervalId !== null) {
			system.clearRun(this._openIntervalId);
			this._openIntervalId = null;
		} else {
			this.sendMessage(`${leaveMessage} §8[${this.players.length}/${this.maxPlayers}]`);
		}
	};

	private teamEliminationCallback = (event: PlayerEliminationEvent): void => {
		event.player.onScreenDisplay.setTitle("§cDEFEAT!");
		this.onElimination.triggerEvent({ game: this, player: event.player, team: event.team });
		if (this.teamsRemaining <= 1) {
			this.state = GameState.Ending;
		}
	};
}
