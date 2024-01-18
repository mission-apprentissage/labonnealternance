export const typedKeys = <Key extends string | number | symbol>(record: Record<Key, any>): Key[] => Object.keys(record) as Key[]

export const entriesToTypedRecord = <A extends string | number | symbol, B>(entries: [A, B][]): Record<A, B> => {
  return Object.fromEntries(entries) as Record<A, B>
}
