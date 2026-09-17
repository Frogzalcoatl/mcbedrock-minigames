import { type Dimension, GameMode, type Player, type Vector3 } from "@minecraft/server";
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
];

export interface GameStateManagerConfig {
	maxPlayers: number;
	playersPerTeam: number;
	playersToStart: number;
	room: Room;
	spectatorPos: Vector3;
	teamCount: number;
}

export class GameStateManager {
	public teams: Team[];
	public readonly playersToStart: number;
	public readonly maxPlayers: number;
	public readonly playersPerTeam: number;
	private _spectatorPos: Vector3;
	private _state: GameState;
	private _room: Room;

	public constructor(config: GameStateManagerConfig) {
		this.teams = [];
		this.playersToStart = config.playersToStart;
		this.maxPlayers = config.maxPlayers;
		this.playersPerTeam = config.playersPerTeam;
		this._spectatorPos = config.spectatorPos;
		this._state = GameState.Preparing;
		this._room = config.room;
		this._room.beforeJoin = this.beforeJoin;
		this._room.onJoin.subscribe(this.onJoin);
		this._room.onLeave.subscribe(this.onLeave);
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
		if (val === GameState.Preparing) {
			for (const t of this.teams) {
				t.resetPlayers();
			}
		}
		this._state = val;
	}

	public get players(): Player[] {
		const dimension: Dimension | undefined = this._room.dimension;
		return dimension?.getPlayers() ?? [];
	}

	private beforeJoin(player: Player): boolean {
		if (this._state === GameState.Preparing) {
			player.sendMessage("§cGame is resetting");
			return false;
		} else if (this._state === GameState.Starting) {
			const players: Player[] = this.players;
			if (players.length >= this.maxPlayers) {
				player.sendMessage("§cGame is full");
				return false;
			}
		} else if (this.state === GameState.Ending) {
			player.sendMessage("§cGame is ending");
			return false;
		}
		return true;
	}

	private onJoin(event: PlayerEvent): void {
		if (this._state === GameState.Starting) {
			this._room.sendMessage(
				`${getPlayerName(event.player)}§r§7 joined the game §8[${this.players.length}/${this.maxPlayers}]`,
			);
		} else if (this.state === GameState.Active) {
			this._room.sendMessage(`${getPlayerName(event.player)}§r§7 is spectating`);
			event.player.setGameMode(GameMode.Spectator);
			event.player.teleport(this._spectatorPos);
		}
	}

	private onLeave(event: PlayerEvent): void {
		if (this._state === GameState.Starting) {
			this._room.sendMessage(
				`${getPlayerName(event.player)}§r§7 left the game §8[${this.players.length}/${this.maxPlayers}]`,
			);
		} else if (this.state === GameState.Active) {
			const team: Team | null = Team.find(event.player);
			if (team !== null) {
				team.remove(event.player, true);
			}
		}
	}
}
