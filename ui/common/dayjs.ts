import dayjs from "dayjs"
import * as advancedFormat from "dayjs/plugin/advancedFormat"
import * as customParseFormat from "dayjs/plugin/customParseFormat"
import * as duration from "dayjs/plugin/duration"
import * as isBetween from "dayjs/plugin/isBetween"
import * as isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import * as isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import * as timezone from "dayjs/plugin/timezone"
import * as utc from "dayjs/plugin/utc"
// TODO_AB

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
