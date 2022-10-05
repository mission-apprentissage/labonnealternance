import { date, integer, object, objectId, string } from "./jsonSchema/jsonSchemaTypes.js";

export const name = "logs";

export function indexes() {
  return [[{ time: 1 }]];
}

export function schema() {
  return object(
    {
      _id: objectId(),
      name: string(),
      hostname: string(),
      pid: integer(),
      level: integer(),
      msg: string(),
      time: date(),
      v: integer(),
    },
    { required: ["time"], additionalProperties: true }
  );
}
