import {
	type DimensionLocation,
	type EntityDieAfterEvent,
	GameMode,
	world,
} from "@minecraft/server";
import { SimulatedPlayer, spawnSimulatedPlayer } from "@minecraft/server-gametest";

export class SimulatedPlayerManager {
	public readonly namespace: string;
	private _autoRespawn: boolean;

	public constructor(namespace: string, autoRespawn: boolean) {
		this.namespace = namespace;
		this._autoRespawn = false;
		this.autoRespawn = autoRespawn;
	}

	private entityDieHandler = (event: EntityDieAfterEvent): void => {
		if (event.deadEntity instanceof SimulatedPlayer) {
			event.deadEntity.respawn();
		}
	};

	public set autoRespawn(val: boolean) {
		if (val === this._autoRespawn) {
			return;
		}
		if (val) {
			world.afterEvents.entityDie.subscribe(this.entityDieHandler);
		} else {
			world.afterEvents.entityDie.unsubscribe(this.entityDieHandler);
		}
		this._autoRespawn = val;
	}

	public get autoRespawn(): boolean {
		return this._autoRespawn;
	}

	public spawn(
		location: DimensionLocation,
		amount = 1,
		name = "SimulatedPlayer",
		gameMode: GameMode = GameMode.Adventure,
	): void {
		for (let i = 0; i < amount; i++) {
			spawnSimulatedPlayer(location, name, gameMode);
		}
	}

	public clear(): void {
		for (const p of world.getAllPlayers()) {
			if (p instanceof SimulatedPlayer) {
				world.sendMessage(`§e${p.name}§r§e left the game`);
				p.disconnect();
			}
		}
	}
}
