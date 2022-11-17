import * as dayjs from "dayjs"
import * as utc from "dayjs/plugin/utc"
import * as duration from "dayjs/plugin/duration"
import * as timezone from "dayjs/plugin/timezone"
import * as isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import * as isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import * as isBetween from "dayjs/plugin/isBetween"
import * as customParseFormat from "dayjs/plugin/customParseFormat"
import * as advancedFormat from "dayjs/plugin/advancedFormat"

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(timezone)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isBetween)
dayjs.extend(customParseFormat)
dayjs.extend(advancedFormat)

/**
 * @description Formats date.
 * @param {string} date
 * @returns {string|void}
 */
const formatDate = (date) => {
  if (!date) {
    return
  }

  return dayjs(date).format("DD/MM/YYYY HH:mm:ss")
}

export { dayjs, formatDate }
