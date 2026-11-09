import {
	type Effect,
	type ItemCompleteUseAfterEvent,
	type ItemStartUseAfterEvent,
	type PlayerLeaveAfterEvent,
	world,
} from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";

/*
Absorption is jank on Minecraft Bedrock Edition.
Each time a player eats multiple Golden Apples in a row, it adds 2 yellow absorption hearts to their health, capping at 8.
On Java Edition, Golden Apples always cap at 2 yellow hearts.
This script aims to replicate the more balanced behavior of java edition.

How it works:
1. Save player absorption amplifier/duration when they start eating a Golden Apple
2. If they fully eat the apple, remove their absorption, then give amplifier/duration to match Java Edition behavior

Known Issue:
Absorption with amplifier > 0 given with commands/scripting improperly stores amplifer as 0.
For example, a player may have 6 extra hearts, but Effect.amplifier is still 0.
With these scripts enabled, that player would lose 4 hearts after eating a golden apple.
I considered using the EntityHealthComponent to determine how many yellow hearts the player has,
but there's no reliable way to correct to a specific amount yellow absorption hearts after removing them.

Avoid this issue by simply not giving absorption with commands/scripting.
You can always use health boost instead.
*/

export class JavaGoldenApple {
	private readonly _playerAbsorption: Map<string, Effect>;
	private _isInitialized: boolean;

	public constructor() {
		this._playerAbsorption = new Map();
		this._isInitialized = false;
	}

	private itemStartUse = (event: ItemStartUseAfterEvent): void => {
		if (event.itemStack.typeId !== MinecraftItemTypes.GoldenApple) {
			return;
		}
		const playerAbsorption: Effect | undefined = event.source.getEffect(
			MinecraftEffectTypes.Absorption,
		);
		if (playerAbsorption !== undefined) {
			this._playerAbsorption.set(event.source.id, playerAbsorption);
		}
	};

	private itemCompleteUse = (event: ItemCompleteUseAfterEvent): void => {
		if (event.itemStack.typeId !== MinecraftItemTypes.GoldenApple) {
			return;
		}
		const oldAbsorption: Effect | undefined = this._playerAbsorption.get(event.source.id);
		let duration: number;
		let amplifier: number;
		if (oldAbsorption === undefined) {
			duration = 2400;
			amplifier = 0;
		} else if (oldAbsorption.amplifier > 0) {
			duration = oldAbsorption.duration;
			amplifier = oldAbsorption.amplifier;
		} else {
			duration = Math.max(oldAbsorption.duration, 2400);
			amplifier = 0;
		}
		event.source.removeEffect(MinecraftEffectTypes.Absorption);
		event.source.addEffect(MinecraftEffectTypes.Absorption, duration, { amplifier: amplifier });
	};

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this._playerAbsorption.delete(event.playerId);
	};

	public init(): void {
		if (!this._isInitialized) {
			world.afterEvents.itemStartUse.subscribe(this.itemStartUse);
			world.afterEvents.itemCompleteUse.subscribe(this.itemCompleteUse);
			world.afterEvents.playerLeave.subscribe(this.playerLeave);
			this._isInitialized = true;
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.itemStartUse.unsubscribe(this.itemStartUse);
			world.afterEvents.itemCompleteUse.unsubscribe(this.itemCompleteUse);
			world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
			this._isInitialized = false;
		}
	}
}
