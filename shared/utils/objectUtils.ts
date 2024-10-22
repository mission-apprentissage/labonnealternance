export const typedKeys = <Key extends string | number | symbol>(record: Record<Key, any>): Key[] => Object.keys(record) as Key[]

export const typedEntries = <Key extends string | number | symbol, Value>(record: Record<Key, Value>): [Key, Value][] => Object.entries(record) as [Key, Value][]

export const entriesToTypedRecord = <Key extends string | number | symbol, Value>(entries: [Key, Value][]): Record<Key, Value> => {
  return Object.fromEntries(entries) as Record<Key, Value>
}

export function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined)) as T
}
