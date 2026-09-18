import { GameMode, type Player, system, type Vector3 } from "@minecraft/server";
import { GameState, type PlayerEvent } from "../../types";
import { getPlayerName } from "../deathMessages";
import type { Room } from "../rooms/room";
import { Team } from "./team";

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

export interface GameConfig {
	maxPlayers: number;
	playersPerTeam: number;
	playersToStart: number;
	room: Room;
	spectatorPos: Vector3;
	teamCount: number;
}

export class Game {
	public teams: Team[];
	public readonly playersToStart: number;
	public readonly maxPlayers: number;
	public readonly playersPerTeam: number;
	public readonly room: Room;
	public spectatorPos: Vector3;
	public prepareGame: ((game: Game) => void) | null;

	private _players: Set<Player>;
	private _state: GameState;
	private _startingIntervalId: number | null;

	public constructor(config: GameConfig) {
		this.teams = [];
		this.playersToStart = config.playersToStart;
		this.maxPlayers = config.maxPlayers;
		this.playersPerTeam = config.playersPerTeam;
		this.room = config.room;
		this.spectatorPos = config.spectatorPos;
		this.prepareGame = null;
		this._players = new Set<Player>();
		this._state = GameState.Preparing;
		this._startingIntervalId = null;
		this.room.beforeJoin = this.beforeJoin;
		this.room.onJoin.subscribe(this.onJoin);
		this.room.onLeave.subscribe(this.onLeave);
		let teamsAdded = 0;
		for (let i = 0; i < Math.min(config.teamCount, teamOrders.length); i++) {
			const current: TeamOrdersValue | undefined = teamOrders[i];
			if (current !== undefined) {
				this.teams.push(
					new Team(current.name, { x: 0.5, y: 0, z: 0.5 }, config.playersPerTeam),
				);
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
	}

	public get state(): GameState {
		return this._state;
	}

	public set state(val: GameState) {
		if (this._state === GameState.Starting && this._startingIntervalId !== null) {
			system.clearRun(this._startingIntervalId);
		}
		if (val === GameState.Preparing) {
			for (const t of this.teams) {
				t.clearPlayers();
			}
		}
		this._state = val;
	}

	public get playerCount(): number {
		return this._players.size;
	}

	public sendMessage(message: string): void {
		for (const p of this._players) {
			p.sendMessage(message);
		}
	}

	private whileStarting(): void {
		if (this._startingIntervalId !== null) {
			system.clearRun(this._startingIntervalId);
		}
		this._startingIntervalId = system.runInterval(() => {
			for (const p of this._players) {
				p.onScreenDisplay.setActionBar(``);
			}
		});
	}

	// Arrow functions because they seem to maintain context of "this"

	private beforeJoin = (player: Player): boolean => {
		if (this._state === GameState.Preparing) {
			player.sendMessage("§cGame is resetting");
			return false;
		} else if (this._state === GameState.Starting) {
			if (this.playerCount >= this.maxPlayers) {
				player.sendMessage("§cGame is full.");
				return false;
			}
		} else if (this.state === GameState.Ending) {
			player.sendMessage("§cGame is ending");
			return false;
		}
		return true;
	};

	private onJoin = (event: PlayerEvent): void => {
		this._players.add(event.player);
		switch (this._state) {
			case GameState.Starting: {
				const playerCount: number = this.playerCount;
				if (playerCount === 1) {
					this.whileStarting();
				}
				this.room.sendMessage(
					`${getPlayerName(event.player)}§r§7 joined the game §8[${playerCount}/${this.maxPlayers}]`,
				);
				break;
			}
			case GameState.Active: {
				this.room.sendMessage(`${getPlayerName(event.player)}§r§7 is spectating`);
				event.player.setGameMode(GameMode.Spectator);
				event.player.teleport(this.spectatorPos);
				break;
			}
			default:
				break;
		}
	};

	private onLeave = (event: PlayerEvent): void => {
		this._players.delete(event.player);
		if (this._state === GameState.Starting) {
			const playerCount: number = this.playerCount;
			if (playerCount !== 0) {
				this.room.sendMessage(
					`${getPlayerName(event.player)}§r§7 left the game §8[${playerCount}/${this.maxPlayers}]`,
				);
			} else if (this._startingIntervalId !== null) {
				system.clearRun(this._startingIntervalId);
			}
		} else if (this._state === GameState.Active) {
			const team: Team | null = Team.findPlayer(event.player);
			if (team !== null) {
				team.remove(event.player, true);
			}
		}
	};
}
