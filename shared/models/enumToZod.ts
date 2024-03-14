import { z } from "../helpers/zodWithOpenApi"

export function enumToZod<T extends string>(enumObject: Record<T, string>) {
  const enumValues = Object.values(enumObject) as string[]
  return z.enum([enumValues[0], ...enumValues.slice(1)])
}
