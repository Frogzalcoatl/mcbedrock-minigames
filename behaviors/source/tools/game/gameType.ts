import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { safeActionFormShow } from "../helpers/safeFormShow";
import { GameJoinResult, QueueMode } from "../types";
import type { Game } from "./game";

export class GameType {
	public readonly instances: Game[];
	public id: string;
	public icon: string;
	public displayName: string;
	public queueMode: QueueMode;
	public hub: GameType | null;
	// Queues this gametype on /hub

	public constructor(
		id: string,
		icon: string,
		displayName: string,
		queueMode: QueueMode,
		hub?: GameType,
	) {
		this.instances = [];
		this.id = id;
		this.icon = icon;
		this.displayName = displayName;
		this.queueMode = queueMode;
		this.hub = hub ?? null;
	}

	public get playerCount(): number {
		let count = 0;
		for (const game of this.instances) {
			count += game.players.length;
		}
		return count;
	}

	public async form(player: Player): Promise<boolean> {
		const form = new ActionFormData();
		form.title(`§0${this.displayName}`);
		for (const game of this.instances) {
			form.button(game.id, this.icon);
		}
		const resp: ActionFormResponse = await safeActionFormShow(form, player);
		if (!player.isValid || resp.selection === undefined) {
			return false;
		}
		const selectedInstance: Game | undefined = this.instances[resp.selection];
		if (selectedInstance === undefined) {
			player.sendMessage("§cUnable to find selected room");
			return false;
		}
		selectedInstance.join(player);
		return true;
	}

	public async queue(player: Player): Promise<boolean> {
		switch (this.queueMode) {
			case QueueMode.ShowForm:
				return await this.form(player);
			case QueueMode.FirstOpenGame:
				return this.queueFirstOpenGame(player);
			case QueueMode.FullyRandom:
				return this.queueRandomGame(player);
			case QueueMode.FindGameWithPlayersWaiting:
				return this.queueGameWithPlayersWaiting(player);
			default:
				player.sendMessage(
					`§c"${this.displayName}" has an invalid QueueMode "${this.queueMode}"`,
				);
				return false;
		}
	}

	private queueFirstOpenGame(player: Player): boolean {
		for (const game of this.instances) {
			if (
				game.canJoin(player) === GameJoinResult.Success &&
				game.join(player) === GameJoinResult.Success
			) {
				return true;
			}
		}
		return false;
	}

	private queueRandomGame(player: Player): boolean {
		const index: number = Math.floor(Math.random() * this.instances.length);
		const game: Game | undefined = this.instances[index];
		if (game?.join(player)) {
			return true;
		}
		// Check if the other games are available if random game failed
		for (let i = 1; i < this.instances.length; i++) {
			const current: Game | undefined = this.instances[(index + i) % this.instances.length];
			if (
				current !== undefined &&
				current.canJoin(player) === GameJoinResult.Success &&
				current.join(player) === GameJoinResult.Success
			) {
				return true;
			}
		}
		return false;
	}

	private queueGameWithPlayersWaiting(player: Player): boolean {
		const hasPlayersWaiting: Game[] = [];
		for (const game of this.instances) {
			if (game.players.length > 0 && game.canJoin(player) === GameJoinResult.Success) {
				hasPlayersWaiting.push(game);
			}
		}
		const randomIndex: number = Math.floor(Math.random() * hasPlayersWaiting.length);
		for (let i = 0; i < hasPlayersWaiting.length; i++) {
			const game: Game | undefined =
				hasPlayersWaiting[(randomIndex + i) % hasPlayersWaiting.length];
			if (game !== undefined && game.join(player) !== GameJoinResult.Failure) {
				return true;
			}
		}
		return false;
	}
}
