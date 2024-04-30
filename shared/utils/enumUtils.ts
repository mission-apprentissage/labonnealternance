export const parseEnum = <T extends string>(enumObj: Record<string, T>, value: string | null | undefined): T | null => {
  return Object.values(enumObj).find((enumValue) => enumValue.toLowerCase() === value?.toLowerCase()) ?? null
}
export const isEnum = <T extends string>(enumValues: Record<string, T>, value: unknown): value is T => typeof value === "string" && parseEnum(enumValues, value) !== null

export const parseEnumOrError = <T extends string>(enumObj: Record<string, T>, value: string | null): T => {
  const enumValue = parseEnum(enumObj, value)
  if (enumValue === null) {
    throw new Error(`could not parse ${value} as enum ${JSON.stringify(Object.values(enumObj))}`)
  }
  return enumValue
}
