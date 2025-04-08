import dayjs from "dayjs"

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
