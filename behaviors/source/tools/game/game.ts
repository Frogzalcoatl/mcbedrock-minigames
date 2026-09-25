import {
	type Dimension,
	EntityComponentTypes,
	type EntityHealthComponent,
	type EntityInventoryComponent,
	GameMode,
	type Player,
	system,
	type Vector3,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION, roomTypeIds } from "../../constants";
import { EventSignal, GameState, type PlayerEvent, TeamDistributionMode } from "../../types";
import { clearEntityEffects, clearEntityEquippable, clearEntityInventory } from "../componentHelpers";
import type { Room } from "../room/room";
import { type RoomType, roomTypeGet, roomTypeJoin } from "../room/roomType";
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

export interface GameEvent {
	game: Game;
}

export interface GameJoinEvent {
	game: Game;
	player: Player;
}

export interface GamePlayerEliminationEvent {
	game: Game;
	oldTeam: Team;
	player: Player;
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
	public static _globalPlayers = new Map<string, Game>();

	public static findPlayer(player: Player): Game | undefined {
		return Game._globalPlayers.get(player.id);
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

	// You should set this.state to GameState.Starting when complete
	public resetGame: ((game: Game) => void) | null;

	public onJoin: EventSignal<GameJoinEvent>;
	public onStart: EventSignal<Game>;
	public whileActive: EventSignal<Game>;
	public onElimination: EventSignal<GamePlayerEliminationEvent>;

	// You should set this.state to GameState.Resetting when complete
	public endGame: ((game: Game) => void) | null;

	private _players: Set<Player>;
	private _spectators: Set<Player>;
	private _state: GameState;
	private _startingIntervalId: number | null;
	private _activeIntervalId: number | null;

	public constructor(config: GameConfig) {
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
		this.onJoin = new EventSignal<GameJoinEvent>();
		this.onStart = new EventSignal<Game>();
		this.whileActive = new EventSignal<Game>();
		this.onElimination = new EventSignal<GamePlayerEliminationEvent>();
		this.endGame = null;
		this._players = new Set<Player>();
		this._spectators = new Set<Player>();
		this._state = GameState.Resetting;
		this._startingIntervalId = null;
		this._activeIntervalId = null;
		this.room.beforeJoin = this.beforeJoin;
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
		if (this._startingIntervalId !== null) {
			system.clearRun(this._startingIntervalId);
			this._startingIntervalId = null;
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
					this._state = GameState.Starting;
				} else {
					this.resetGame(this);
				}
				break;
			}
			case GameState.Starting: {
				if (this.playerCount > 0) {
					this.whileStarting();
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

	public get playerCount(): number {
		return this._players.size;
	}

	public get players(): Player[] {
		return [...this._players];
	}

	public get spectators(): Player[] {
		return [...this._spectators];
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
		for (const p of this._players) {
			p.sendMessage(message);
		}
		for (const s of this._spectators) {
			s.sendMessage(message);
		}
	}

	public setActionBar(text: string): void {
		for (const p of this._players) {
			p.onScreenDisplay.setActionBar(text);
		}
		for (const s of this._spectators) {
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
		player.setGameMode(GameMode.Spectator);
		system.runTimeout(() => player.teleport(this.spectatorPos, { dimension: dimension }), 5);
		this._spectators.add(player);
		this.sendMessage(`${getPlayerName(player)}§r§7 is spectating`);
	}

	public clearPlayers(): void {
		const hubRoomType: RoomType | undefined = roomTypeGet(roomTypeIds.hub);
		for (const t of this.teams) {
			t.clearPlayers(false);
		}
		if (hubRoomType !== undefined) {
			for (const p of this._players) {
				roomTypeJoin(p, hubRoomType);
			}
			for (const s of this._spectators) {
				roomTypeJoin(s, hubRoomType);
			}
		}
		this._spectators.clear();
		this._players.clear();
	}

	private whileStarting(): void {
		if (this._startingIntervalId !== null) {
			system.clearRun(this._startingIntervalId);
			this._startingIntervalId = null;
		}
		const playSoundDuring = new Set<number>([60, 30, 20, 10, 5, 4, 3, 2, 1]);
		playSoundDuring.add(this.startTimeSeconds);
		this.secondsRemaining = this.startTimeSeconds;
		const intervalId: number = system.runInterval(() => {
			const playerCount: number = this.playerCount;
			if (playerCount < this.playersToStart) {
				this.secondsRemaining = this.startTimeSeconds;
				const playersNeeded: number = this.playersToStart - playerCount;
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
			if (playSoundDuring.has(this.secondsRemaining)) {
				for (const p of this._players) {
					p.playSound("random.click");
				}
				for (const s of this._spectators) {
					s.playSound("random.click");
				}
			}
			this.secondsRemaining -= 1;
		}, 20);
		this._startingIntervalId = intervalId;
	}

	private startGame(): void {
		Team.distribute(this.teams, [...this._players], TeamDistributionMode.InOrder);
		for (const t of this.teams) {
			t.spawnPlayers();
		}
		system.runTimeout(() => {
			for (const p of this._players) {
				p.playSound("random.orb");
			}
			for (const s of this._spectators) {
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

	private beforeJoin = (player: Player): boolean => {
		switch (this._state) {
			case GameState.Resetting: {
				player.sendMessage("§cUnable to join game: Game is resetting");
				return false;
			}
			case GameState.Starting: {
				if (this.playerCount >= this.maxPlayers) {
					player.sendMessage("§cUnable to join game: Game is full");
					return false;
				}
				break;
			}
			case GameState.Ending: {
				player.sendMessage("§cUnable to join game: Game is ending");
				return false;
			}
			default:
				break;
		}
		return true;
	};

	private roomOnJoin = (event: PlayerEvent): void => {
		clearEntityEffects(event.player);
		const health: EntityHealthComponent | undefined = event.player.getComponent(
			EntityComponentTypes.Health,
		);
		if (health !== undefined) {
			health.resetToMaxValue();
		}
		clearEntityEquippable(event.player);
		const inventory: EntityInventoryComponent | undefined = event.player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			inventory.container.clearAll();
		}
		if (this._state !== GameState.Starting || this.playerCount >= this.maxPlayers) {
			this.addSpectator(event.player);
			return;
		}
		this._players.add(event.player);
		event.player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
			amplifier: 255,
			showParticles: false,
		});
		this.sendMessage(
			`${getPlayerName(event.player)}§r§7 joined the game §8[${this.playerCount}/${this.maxPlayers}]`,
		);
		if (this.playerCount === 1) {
			this.whileStarting();
		}
		this.onJoin.triggerEvent({ game: this, player: event.player });
	};

	private roomOnLeave = (event: PlayerEvent): void => {
		const leaveMessage: string = `${getPlayerName(event.player)}§r§7 left the game`;
		const team: Team | null = Team.findPlayer(event.player);
		if (team !== null) {
			team.remove(event.player, this._state === GameState.Active);
		}
		this._players.delete(event.player);
		this._spectators.delete(event.player);
		if (this._state !== GameState.Starting) {
			this.sendMessage(leaveMessage);
			return;
		}
		const playerCount: number = this.playerCount;
		if (playerCount !== 0) {
			this.sendMessage(`${leaveMessage} §8[${playerCount}/${this.maxPlayers}]`);
		} else if (this._startingIntervalId !== null) {
			system.clearRun(this._startingIntervalId);
			this._startingIntervalId = null;
		}
	};

	private teamEliminationCallback = (event: PlayerEliminationEvent): void => {
		event.player.onScreenDisplay.setTitle("§cDEFEAT!");
		this.onElimination.triggerEvent({ game: this, oldTeam: event.team, player: event.player });
		if (this.teamsRemaining <= 1) {
			this.state = GameState.Ending;
		}
	};
}
