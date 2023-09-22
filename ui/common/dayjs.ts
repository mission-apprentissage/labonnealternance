// eslint-disable-next-line import/no-extraneous-dependencies
import dayjs from "dayjs"
// eslint-disable-next-line import/no-extraneous-dependencies
import * as advancedFormat from "dayjs/plugin/advancedFormat"
// eslint-disable-next-line import/no-extraneous-dependencies
import * as customParseFormat from "dayjs/plugin/customParseFormat"
// eslint-disable-next-line import/no-extraneous-dependencies
import * as duration from "dayjs/plugin/duration"
// eslint-disable-next-line import/no-extraneous-dependencies
import * as isBetween from "dayjs/plugin/isBetween"
// eslint-disable-next-line import/no-extraneous-dependencies
import * as isSameOrAfter from "dayjs/plugin/isSameOrAfter"
// eslint-disable-next-line import/no-extraneous-dependencies
import * as isSameOrBefore from "dayjs/plugin/isSameOrBefore"
// eslint-disable-next-line import/no-extraneous-dependencies
import * as timezone from "dayjs/plugin/timezone"
// eslint-disable-next-line import/no-extraneous-dependencies
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
