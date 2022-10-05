import { object, objectId, number } from "./jsonSchema/jsonSchemaTypes.js";

export const name = "migrations";

export function indexes() {
  return [[{ version: 1 }]];
}

export function schema() {
  return object(
    {
      _id: objectId(),
      version: number(),
    },
    { required: ["version"] }
  );
}
