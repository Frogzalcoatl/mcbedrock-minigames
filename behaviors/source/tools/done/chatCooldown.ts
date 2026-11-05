import {
	type ChatSendBeforeEvent,
	type Player,
	type PlayerLeaveAfterEvent,
	world,
} from "@minecraft/server";

export type ChatCallback = (event: ChatSendBeforeEvent) => void;
export type CooldownBypassCallback = (sender: Player) => boolean; // Return true to bypass cooldown

export class ChatCooldownManager {
	public cooldownMs: number;
	public eventHandler: ChatCallback | null;
	private readonly timestamps: Map<string, number>;

	public constructor(cooldownMs: number) {
		this.cooldownMs = cooldownMs;
		this.eventHandler = null;
		this.timestamps = new Map();
	}

	private chatSend = (event: ChatSendBeforeEvent): void => {
		const timestamp: number | undefined = this.timestamps.get(event.sender.id);
		const now: number = Date.now();
		if (timestamp !== undefined && timestamp + this.cooldownMs > now) {
			const remainingSec: number = Math.ceil((timestamp + this.cooldownMs - now) / 1000);
			event.sender.sendMessage(`§cPlease wait ${remainingSec}s before chatting again.`);
			event.cancel = true;
			return;
		}
		if (this.eventHandler !== null) {
			this.eventHandler(event);
		}
		if (!event.cancel) {
			this.timestamps.set(event.sender.id, now);
		}
	};

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this.timestamps.delete(event.playerId);
	};

	public init(): void {
		world.beforeEvents.chatSend.subscribe(this.chatSend);
		world.afterEvents.playerLeave.subscribe(this.playerLeave);
	}

	public shutdown(): void {
		world.beforeEvents.chatSend.unsubscribe(this.chatSend);
		world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
	}
}
