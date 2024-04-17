export const rateLimitDescription = ({ max, timeWindow }: { max: number; timeWindow: string }) => {
  const match = new RegExp("^([0-9]+)s$", "gi").exec(timeWindow)
  if (!match) {
    throw new Error(`timeWindow format unsupported: ${timeWindow}`)
  }
  const timeWindowInSeconds = parseInt(match[1], 10)
  return `Limite : ${max} appel(s) / ${timeWindowInSeconds} seconde(s)\n`
}
