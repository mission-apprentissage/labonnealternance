export const getDaysSinceDate = (fromDate) => {
  const date = new Date(fromDate)
  const today = new Date()
  const daysSince = Math.floor((today - date) / (1000 * 60 * 60 * 24))
  return daysSince > 0 ? daysSince : 0
}
