// eslint-disable-next-line import/no-extraneous-dependencies
import dayjs from "dayjs" // TODO_AB
// eslint-disable-next-line import/no-extraneous-dependencies
import relativeTime from "dayjs/plugin/relativeTime" // TODO_AB

import { NBR_EXPIRATION_J7 } from "../contants"

/**
 * Format a date to YYYY-MM-DD.
 * @param {date} date - a JavaScript Date
 * @param {string} author - The author of the book.
 * @returns {string} - A string representation of the date : YYYY-MM-DD
 */
export const formatDate = (date) => dayjs(date).format("YYYY-MM-DD")

/**
 * Get the current date, as a formatted string : YYYY/MM/DD (separator can be changed)
 * @param {string} separator - Optionnally change the separator, defaults to "/".
 * @returns {string} - A string representation of the date : YYYY/MM/DD
 */
export const getCurrentDate = (separator = "/") => {
  return dayjs().format(`YYYY${separator}MM${separator}DD`)
}

/**
 * Get the current hour and minutes, as a formatted string : 14h42
 * @param {string} separator - Optionnally change the separator, defaults to "h".
 * @returns {string} - A string representation of the hour and minutes, for example, 10h07
 */
export const getCurrentHourMinute = (separator = "h") => {
  const currentDatetime = dayjs()
  return dayjs(currentDatetime).format(`HH`) + separator + dayjs(currentDatetime).format(`mm`)
}

export const willExpire = (date_expiration) => {
  dayjs.extend(relativeTime)

  const expire = dayjs(date_expiration)
  const result = expire.diff(Date(), "days") > NBR_EXPIRATION_J7 ? false : true

  return result
}

export const sortReactTableDate = (a, b) => {
  const val = dayjs(a).isAfter(dayjs(b))

  if (val) {
    return 1
  } else {
    return -1
  }
}

export const sortReactTableString = (a, b) => {
  const val = a.localeCompare(b, "fr")

  // localeCompare can return -2, check if val is negative or positive
  if (val > 0) {
    return 1
  } else {
    return -1
  }
}
