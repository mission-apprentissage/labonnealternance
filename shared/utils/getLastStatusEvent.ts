export const getLastStatusEvent = <Status, T extends { date?: Date | null; status?: Status }>(stateArray?: T[]): T | null => {
  if (!stateArray) {
    return null
  }
  const sortedArray = [...stateArray].sort((a, b) => {
    return new Date(a?.date ?? 0).valueOf() < new Date(b?.date ?? 0).valueOf() ? -1 : 1
  })
  const lastValidationEvent = sortedArray.at(sortedArray.length - 1)
  if (!lastValidationEvent) {
    return null
  }
  return lastValidationEvent.status ? lastValidationEvent : null
}
