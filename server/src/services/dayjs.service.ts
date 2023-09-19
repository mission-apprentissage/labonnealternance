import { extend } from "dayjs"
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

extend(utc)
extend(duration)
extend(timezone)
extend(isSameOrBefore)
extend(isSameOrAfter)
extend(isBetween)
extend(customParseFormat)
extend(advancedFormat)
extend(isYesterday)
extend(localizedFormat)

export type TDayjs = dayjs.Dayjs

export default dayjs
