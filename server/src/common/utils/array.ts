export const getPairs = <T>(array: T[]): [T, T][] => {
  if (array.length < 2) {
    return []
  }
  const pairs: [T, T][] = []
  for (let i = 0; i < array.length - 1; ++i) {
    for (let j = i + 1; j < array.length; ++j) {
      pairs.push([array[i], array[j]] as const)
    }
  }
  return pairs
}

export const deduplicate = <T extends string | number>(array: T[]): T[] => {
  return array.filter((item, index) => array.indexOf(item) === index)
}

export const deduplicateBy = <T>(array: T[], valueFct: (item: T) => string | number): T[] => {
  const valuesArray = array.map((item) => [item, valueFct(item)] as const)
  const uniqueValues = deduplicate(valuesArray.map(([, value]) => value))
  return valuesArray.flatMap(([item, value], index) => (uniqueValues.indexOf(value) === index ? [item] : []))
}
