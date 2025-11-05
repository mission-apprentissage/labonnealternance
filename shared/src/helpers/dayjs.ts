import dayjs from "dayjs"
import "dayjs/locale/fr.js"
import advancedFormat from "dayjs/plugin/advancedFormat.js"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import duration from "dayjs/plugin/duration.js"
import isBetween from "dayjs/plugin/isBetween.js"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import isYesterday from "dayjs/plugin/isYesterday.js"
import localizedFormat from "dayjs/plugin/localizedFormat.js"
import timezonePlugin from "dayjs/plugin/timezone.js"
import utcPlugin from "dayjs/plugin/utc.js"

dayjs.locale("fr")
dayjs.extend(utcPlugin)
dayjs.extend(duration)
dayjs.extend(timezonePlugin)
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
