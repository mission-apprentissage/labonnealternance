import dayjs from "dayjs"

export const getDaysSinceDate = (fromDate: number | string | Date): number => {
  const date = new Date(fromDate)
  const today = new Date()
  const daysSince = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince > 0 ? daysSince : 0
}

/**
 * Get the current date, as a formatted string : YYYY/MM/DD (separator can be changed)
 * @param {string} separator - Optionally change the separator, defaults to "/".
 * @returns {string} - A string representation of the date : YYYY/MM/DD
 */
export const getCurrentDate = (separator = "/") => {
  return dayjs().format(`YYYY${separator}MM${separator}DD`)
}

/**
 * Get the current hour and minutes, as a formatted string : 14h42
 * @param {string} separator - Optionally change the separator, defaults to "h".
 * @returns {string} - A string representation of the hour and minutes, for example, 10h07
 */
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
