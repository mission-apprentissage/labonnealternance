import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"
import advancedFormat from "dayjs/plugin/advancedFormat.js"
import duration from "dayjs/plugin/duration.js"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isBetween from "dayjs/plugin/isBetween.js"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import isYesterday from "dayjs/plugin/isYesterday.js"

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(timezone)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isBetween)
dayjs.extend(customParseFormat)
dayjs.extend(advancedFormat)
dayjs.extend(isYesterday)

/**
 * @description Formats date.
 * @param {string} date
 * @returns {string|void}
 */
const formatDate = (date) => {
  if (!date) {
    return
  }

  return dayjs.tz(date, "Europe/Paris").format("DD/MM/YYYY")
}

/**
 * @description Formats date.
 * @param {string} date
 * @returns {string|void}
 */
const formatDatetime = (date) => {
  if (!date) {
    return
  }

  return dayjs.tz(date, "Europe/Paris").format("DD/MM/YYYY HH:mm:ss")
}

export { dayjs, formatDate, formatDatetime }
