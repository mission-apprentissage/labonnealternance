const round = (value: number) => Math.round(value * 100) / 100

export const rateLimitDescription = ({ max, timeWindow }: { max: number; timeWindow: string }) => {
  const match = new RegExp("^([0-9]+)s$", "gi").exec(timeWindow)
  if (!match) {
    throw new Error(`timeWindow format unsupported: ${timeWindow}`)
  }
  const timeWindowInSeconds = parseInt(match[1], 10)
  const rate = max / timeWindowInSeconds
  return `Limite : ${round(rate)} appel(s) / seconde\n`
}
