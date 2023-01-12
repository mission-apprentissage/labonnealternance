import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat.js"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import duration from "dayjs/plugin/duration.js"
import isBetween from "dayjs/plugin/isBetween.js"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import isYesterday from "dayjs/plugin/isYesterday.js"
import localizedFormat from "dayjs/plugin/localizedFormat.js"
import timezone from "dayjs/plugin/timezone.js"
import utc from "dayjs/plugin/utc.js"

import "dayjs/locale/fr"

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(timezone)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isBetween)
dayjs.extend(customParseFormat)
dayjs.extend(advancedFormat)
dayjs.extend(isYesterday)
dayjs.extend(localizedFormat)

dayjs.locale("fr")

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
