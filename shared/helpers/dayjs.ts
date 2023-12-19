import dayjs from "dayjs"
// eslint-disable-next-line import/extensions
import "dayjs/locale/fr"
import advancedFormat from "dayjs/plugin/advancedFormat"
import customParseFormat from "dayjs/plugin/customParseFormat"
import duration from "dayjs/plugin/duration"
import isBetween from "dayjs/plugin/isBetween"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isYesterday from "dayjs/plugin/isYesterday"
import localizedFormat from "dayjs/plugin/localizedFormat"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

dayjs.locale("fr")
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

dayjs.tz.setDefault("Europe/Paris")

export type TDayjs = dayjs.Dayjs

export default dayjs
