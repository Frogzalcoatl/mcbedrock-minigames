import type { Player } from "@minecraft/server";
import {
	type ActionFormData,
	type ActionFormResponse,
	FormCancelationReason,
	FormRejectError,
	type MessageFormData,
	type MessageFormResponse,
	type ModalFormData,
	type ModalFormResponse,
} from "@minecraft/server-ui";

// Minecraft throws FromRejectError when a player discnonects while viewing a form
// These functions catch that error and return response object where resp.canceled = true
// (as mojang should be doing imo)

export async function safeActionFormShow(
	form: ActionFormData,
	player: Player,
): Promise<ActionFormResponse> {
	try {
		const resp: ActionFormResponse = await form.show(player);
		return resp;
	} catch (error) {
		if (error instanceof FormRejectError) {
			return {
				cancelationReason: FormCancelationReason.UserClosed,
				canceled: true,
			};
		} else {
			throw error;
		}
	}
}

export async function safeModalFormShow(
	form: ModalFormData,
	player: Player,
): Promise<ModalFormResponse> {
	try {
		const resp: ModalFormResponse = await form.show(player);
		return resp;
	} catch (error) {
		if (error instanceof FormRejectError) {
			return {
				cancelationReason: FormCancelationReason.UserClosed,
				canceled: true,
			};
		} else {
			throw error;
		}
	}
}

export async function safeMessageFormShow(
	form: MessageFormData,
	player: Player,
): Promise<MessageFormResponse> {
	try {
		const resp: MessageFormResponse = await form.show(player);
		return resp;
	} catch (error) {
		if (error instanceof FormRejectError) {
			return {
				cancelationReason: FormCancelationReason.UserClosed,
				canceled: true,
			};
		} else {
			throw error;
		}
	}
}
