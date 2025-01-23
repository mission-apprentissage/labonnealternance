export const getLastStatusEvent = <Status, T extends { date?: Date | null; status?: Status }>(stateArray?: T[]): T | null => {
  const sortedArray = getSortedStatusEvents(stateArray)
  const lastValidationEvent = sortedArray.at(sortedArray.length - 1)
  return lastValidationEvent?.status ? lastValidationEvent : null
}

export const getSortedStatusEvents = <Status, T extends { date?: Date | null; status?: Status }>(stateArray?: T[]): T[] => {
  if (!stateArray) {
    return []
  }
  const sortedArray = [...stateArray].sort((a, b) => {
    return new Date(a?.date ?? 0).valueOf() < new Date(b?.date ?? 0).valueOf() ? -1 : 1
  })
  return sortedArray
}
