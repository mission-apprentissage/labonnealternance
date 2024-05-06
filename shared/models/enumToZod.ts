import { z } from "../helpers/zodWithOpenApi"

export function enumToZod<Value extends string>(enumObject: Record<string, Value>): z.ZodEnum<[Value, ...Value[]]> {
  const enumValues = Object.values(enumObject)
  return z.enum([enumValues[0], ...enumValues.slice(1)])
}
