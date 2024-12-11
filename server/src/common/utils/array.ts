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
