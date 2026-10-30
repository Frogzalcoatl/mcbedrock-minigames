import { type Player, system } from "@minecraft/server";
import { EventSignal, TeamDistributionMode } from "../../types";
import { EliminatableTeam, type PlayerEliminationEvent, Team } from "./team";

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

function newTeamFor(manager: TeamManager, name: string): Team {
	if (manager instanceof EliminatableTeamManager) {
		return new EliminatableTeam(name, { x: 0.5, y: 0, z: 0.5 }, manager.playersPerTeam);
	} else {
		return new Team(name, manager.playersPerTeam);
	}
}

function initTeamOrders(manager: TeamManager, teamCount: number): void {
	manager.teams.length = 0;
	let teamsAdded = 0;
	const maxI: number = Math.min(teamCount, teamOrders.length);
	for (let i = 0; i < maxI; i++) {
		const current: TeamOrdersValue | undefined = teamOrders[i];
		if (current !== undefined) {
			const team: Team = newTeamFor(manager, current.name);
			team.colorCode = current.colorCode;
			manager.teams.push(team);
			teamsAdded++;
		}
	}
	if (teamsAdded < teamCount) {
		const remaining: number = teamCount - teamsAdded;
		for (let i = 1; i <= remaining; i++) {
			manager.teams.push(newTeamFor(manager, `Extra-${i}`));
		}
	}
}

export class TeamManager {
	public playersPerTeam: number;
	public readonly teams: Team[];

	public constructor(playersPerTeam: number, teamCount: number) {
		this.playersPerTeam = playersPerTeam;
		this.teams = [];
		initTeamOrders(this, teamCount);
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

	public find(player: Player): Team | null {
		for (const t of this.teams) {
			if (t.activePlayers.indexOf(player) !== -1) {
				return t;
			}
		}
		return null;
	}

	public reset(): void {
		for (const t of this.teams) {
			t.reset();
		}
	}

	public distribute(
		players: Player[],
		mode: TeamDistributionMode = TeamDistributionMode.Balanced,
	): void {
		if (this.teams.length === 0) {
			return;
		}
		switch (mode) {
			case TeamDistributionMode.Balanced: {
				break;
			}
			case TeamDistributionMode.InOrder: {
				let i = 0;
				let currentTeam: Team | undefined = this.teams[i];
				if (currentTeam === undefined) {
					return;
				}
				for (const p of players) {
					if (this.find(p) !== null) {
						continue;
					}
					while (currentTeam.activePlayers.length >= currentTeam.maxPlayers) {
						currentTeam = this.teams[++i];
						if (currentTeam === undefined) {
							return;
						}
					}
					currentTeam.join(p);
				}
				break;
			}
			default:
				break;
		}
	}
}

export class EliminatableTeamManager extends TeamManager {
	public override readonly teams: EliminatableTeam[];
	public readonly onPlayerElimination: EventSignal<PlayerEliminationEvent>;
	public readonly onTeamElmination: EventSignal<EliminatableTeam>;
	public readonly onTeamWin: EventSignal<EliminatableTeam[]>; // (length > 1) on tie
	private readonly _teamsEliminatedThisTick: EliminatableTeam[];

	public constructor(playersPerTeam: number, teamCount: number) {
		super(playersPerTeam, teamCount);
		this.teams = [];
		this.onPlayerElimination = new EventSignal<PlayerEliminationEvent>();
		this.onTeamElmination = new EventSignal<EliminatableTeam>();
		this.onTeamWin = new EventSignal<EliminatableTeam[]>();
		this._teamsEliminatedThisTick = [];
		for (const t of this.teams) {
			t.onPlayerElimination.subscribe(this.playerEliminationCallback);
			t.onTeamElimination.subscribe(this.teamEliminationCallback);
		}
	}

	public override find(player: Player): Team | null {
		for (const t of this.teams) {
			if (t.activePlayers.indexOf(player) !== -1 || t.eliminatedPlayers.indexOf(player) !== -1) {
				return t;
			}
		}
		return null;
	}

	private winCheck = (): void => {
		const teamsRemaining: number = this.teamsRemaining;
		if (teamsRemaining === 1) {
			const eventArr: EliminatableTeam[] = [];
			const winningTeam: EliminatableTeam | undefined = this.teams[0];
			if (winningTeam !== undefined) {
				eventArr.push(winningTeam);
			}
			this.onTeamWin.triggerEvent(eventArr);
		} else if (teamsRemaining <= 0) {
			// A tie occurred
			this.onTeamWin.triggerEvent(this._teamsEliminatedThisTick);
		}
		this._teamsEliminatedThisTick.length = 0;
	};

	private teamEliminationCallback = (eliminatedTeam: EliminatableTeam): void => {
		this.onTeamElmination.triggerEvent(eliminatedTeam);
		this._teamsEliminatedThisTick.push(eliminatedTeam);
		if (this._teamsEliminatedThisTick.length === 0) {
			system.run(this.winCheck);
		}
	};

	private playerEliminationCallback = (event: PlayerEliminationEvent): void => {
		this.onPlayerElimination.triggerEvent(event);
	};
}
