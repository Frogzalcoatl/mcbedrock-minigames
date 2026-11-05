/** biome-ignore-all lint/style/useNamingConvention: Enum-like naming */
import { type Entity, EntityHealthComponent, InvalidEntityError } from "@minecraft/server";

/**
 * Describes the lifecycle state of an {@link Entity}.
 */
export const EntityState = {
	/**
	 * A living entity.
	 */
	Alive: 0,
	/**
	 * A dead entity.
	 */
	Dead: 1,
	/**
	 * An invalid entity.
	 */
	Invalid: 2,
} as const;

/**
 * Type alias for {@link EntityState}.
 */
export type EntityState = (typeof EntityState)[keyof typeof EntityState];

/**
 * Gets the current state of an entity.
 *
 * @remarks
 * Due to some unfun quirks of Minecraft Bedrock, this must be used to determine if an entity is alive, dead, or
 * invalid.
 * Minecraft's {@link Entity} provides a `isValid` field however it is `false` when an entity is dead. This
 * is incorrect since some entities, like players, can be dead while being valid.
 *
 * This relies on {@link isEntityValid} and some conditional logic to determine a more specific state of the entity
 * without relying on the potentially absent {@link EntityHealthComponent} component.
 *
 * @param entity The entity to get the state of.
 *
 * @returns The `entity`'s determined {@link EntityState}.
 */
export function getEntityState(entity: Entity): EntityState {
	if (entity.isValid) {
		return EntityState.Alive;
	}
	if (isEntityValid(entity)) {
		return EntityState.Dead;
	}
	return EntityState.Invalid;
}

/**
 * Determines if an entity is invalid.
 *
 * @remarks
 * Due to some unfun quirks of Minecraft Bedrock, this must be used to determine if an entity is truly invalid or dead.
 * Minecraft's {@link Entity} provides a `isValid` field however it is `false` when an entity is dead. This
 * is incorrect since some entities, like players, can be dead while being valid.
 *
 * It determines if an entity is invalid by testing {@link Entity.getComponents}. That method throws an
 * {@link InvalidEntityError} when the entity is actually invalid. This specific error gets caught and returns as
 * invalid. Otherwise returns true.
 *
 * @param entity The entity to validate.
 *
 * @returns The validity of the entity
 */
export function isEntityValid(entity: Entity): boolean {
	try {
		entity.getComponents();
		return true;
	} catch (error) {
		if (error instanceof InvalidEntityError) {
			return false;
		}
		throw error;
	}
}
