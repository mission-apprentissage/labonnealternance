export const getDaysSinceDate = (fromDate: number | string | Date): number => {
  const date = new Date(fromDate)
  const today = new Date()
  const daysSince = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince > 0 ? daysSince : 0
}
