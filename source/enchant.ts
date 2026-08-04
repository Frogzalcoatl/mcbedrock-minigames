import {
	type Enchantment,
	type EnchantmentType,
	EnchantmentTypes,
	ItemComponentTypes,
	type ItemEnchantableComponent,
	type ItemStack,
} from "@minecraft/server";

export function applyEnchant(item: ItemStack, id: string, level: number = 1): void {
	const enchantable: ItemEnchantableComponent | undefined = item.getComponent(
		ItemComponentTypes.Enchantable,
	);
	if (enchantable === undefined) {
		return;
	}
	const enchantType: EnchantmentType | undefined = EnchantmentTypes.get(id);
	if (enchantType === undefined) {
		return;
	}
	const enchantment: Enchantment = {
		level: level,
		type: enchantType,
	};
	enchantable.addEnchantment(enchantment);
}
