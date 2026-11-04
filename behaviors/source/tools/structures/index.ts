import { PACK_NAMESPACE } from "../constants";
import { StructureSchemaManager } from "./structureSchemaManager";

// Insert pack namespace in constructor:
export const structureSchemaManager = new StructureSchemaManager(PACK_NAMESPACE);
