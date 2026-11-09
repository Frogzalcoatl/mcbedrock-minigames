import {
	type ChatSendBeforeEvent,
	type Player,
	type PlayerLeaveAfterEvent,
	system,
	world,
} from "@minecraft/server";
import { EventSignal } from "./shared/eventSignal";

export interface ChatCooldownRejectEvent {
	message: string;
	sender: Player;
	ticksRemaining: number;
}

export interface ChatCooldownAcceptEvent {
	// Set to true to suppress vanilla minecraft chat messages
	cancelVanillaEvent: boolean;
	readonly message: string;
	readonly sender: Player;
}

export class ChatCooldownManager {
	public cooldownTicks: number;
	public readonly onChatAccept: EventSignal<ChatCooldownAcceptEvent>;
	public readonly onChatReject: EventSignal<ChatCooldownRejectEvent>;
	public isBypassed: ((player: Player) => boolean) | null;
	private readonly _timestamps: Map<string, number>;

	public constructor(cooldownTicks: number) {
		this.cooldownTicks = cooldownTicks;
		this.onChatAccept = new EventSignal();
		this.onChatReject = new EventSignal();
		this.isBypassed = null;
		this._timestamps = new Map();
	}

	private chatSend = (event: ChatSendBeforeEvent): void => {
		if (event.cancel) {
			// In case event was already cancelled by another callback for whatever reason
			return;
		}
		const bypassed: boolean = this.isBypassed?.(event.sender) ?? false;
		if (!bypassed) {
			const timestamp: number | undefined = this._timestamps.get(event.sender.id);
			if (timestamp !== undefined && timestamp + this.cooldownTicks > system.currentTick) {
				const ticksRemaining: number = timestamp + this.cooldownTicks - system.currentTick;
				event.cancel = true;
				this.onChatReject.triggerEvent({
					message: event.message,
					sender: event.sender,
					ticksRemaining: ticksRemaining,
				});
				return;
			}
		}
		const acceptEvent: ChatCooldownAcceptEvent = {
			cancelVanillaEvent: false,
			message: event.message,
			sender: event.sender,
		};
		this.onChatAccept.triggerEvent(acceptEvent);
		if (acceptEvent.cancelVanillaEvent) {
			event.cancel = true;
		}
		if (!bypassed) {
			this._timestamps.set(event.sender.id, system.currentTick);
		}
	};

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this._timestamps.delete(event.playerId);
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
