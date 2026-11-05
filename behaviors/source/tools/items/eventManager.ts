import {
	EntitySwingSource,
	HeldItemOption,
	type ItemUseAfterEvent,
	type PlayerSwingStartAfterEvent,
	world,
} from "@minecraft/server";

interface ItemUseValue {
	callback: (event: ItemUseAfterEvent) => void;
	typeId: string;
}

interface ItemSwingEntry {
	callback: (event: PlayerSwingStartAfterEvent) => void;
	typeId: string;
}

export class ItemEventManager {
	private readonly _itemUseMap: Map<string, ItemUseValue>;
	private readonly _itemSwingValues: Map<string, ItemSwingEntry>;

	public constructor() {
		this._itemUseMap = new Map();
		this._itemSwingValues = new Map();
	}

	public onUse(
		nameTag: string,
		typeId: string,
		callback: (event: ItemUseAfterEvent) => void,
	): void {
		this._itemUseMap.set(nameTag, { callback: callback, typeId: typeId });
	}

	public removeOnUse(nameTag: string): void {
		this._itemUseMap.delete(nameTag);
	}

	public onSwing(
		nameTag: string,
		typeId: string,
		callback: (event: PlayerSwingStartAfterEvent) => void,
	): void {
		this._itemSwingValues.set(nameTag, {
			callback: callback,
			typeId: typeId,
		});
	}

	public removeOnSwing(nameTag: string): void {
		this._itemSwingValues.delete(nameTag);
	}

	private itemUse = (event: ItemUseAfterEvent): void => {
		if (event.itemStack.nameTag === undefined) {
			return;
		}
		const value: ItemUseValue | undefined = this._itemUseMap.get(event.itemStack.nameTag);
		if (value !== undefined && value.typeId === event.itemStack.typeId) {
			value.callback(event);
		}
	};

	private playerSwingStart = (event: PlayerSwingStartAfterEvent): void => {
		if (event.heldItemStack === undefined || event.heldItemStack.nameTag === undefined) {
			return;
		}
		const entry: ItemSwingEntry | undefined = this._itemSwingValues.get(
			event.heldItemStack.nameTag,
		);
		if (entry !== undefined && entry.typeId === event.heldItemStack.typeId) {
			entry.callback(event);
		}
	};

	public init(): void {
		world.afterEvents.itemUse.subscribe(this.itemUse);
		world.afterEvents.playerSwingStart.subscribe(this.playerSwingStart, {
			heldItemOption: HeldItemOption.AnyItem,
			swingSource: EntitySwingSource.Attack,
		});
	}

	public shutdown(): void {
		world.afterEvents.itemUse.unsubscribe(this.itemUse);
		world.afterEvents.playerSwingStart.unsubscribe(this.playerSwingStart);
	}
}
