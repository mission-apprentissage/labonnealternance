import dayjs from "dayjs"

export const getDaysSinceDate = (fromDate: number | string | Date): number => {
  const date = new Date(fromDate)
  const today = new Date()
  const daysSince = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince > 0 ? daysSince : 0
}

export const getCurrentDate = (separator = "/") => {
  return dayjs().format(`YYYY${separator}MM${separator}DD`)
}

export const getCurrentHourMinute = (separator = "h") => {
  const currentDatetime = dayjs()
  return dayjs(currentDatetime).format(`HH`) + separator + dayjs(currentDatetime).format(`mm`)
}

export const sortReactTableDate = (a: string | number | Date, b: string | number | Date) => {
  const dateA = dayjs(a)
  const dateB = dayjs(b)

  if (dateA.isAfter(dateB)) return 1
  if (dateA.isBefore(dateB)) return -1
  return 0
}

export const sortReactTableString = (a: string, b: string) => {
  // localeCompare can return any negative/positive number depending on the engine, normalize to -1/0/1
  return Math.sign(a.localeCompare(b, "fr"))
}
