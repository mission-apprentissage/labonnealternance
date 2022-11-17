import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { NBR_EXPIRATION_J7 } from "../contants"

export const willExpire = (date_expiration) => {
  dayjs.extend(relativeTime)

  const expire = dayjs(date_expiration)
  const result = expire.diff(Date(), "days") > NBR_EXPIRATION_J7 ? false : true

  return result
}

export const sortReactTableDate = (a, b) => {
  let val = dayjs(a).isAfter(dayjs(b))

  if (val) {
    return 1
  } else {
    return -1
  }
}

export const sortReactTableString = (a, b) => {
  let val = a.localeCompare(b, "fr")

  // localeCompare can return -2, check if val is negative or positive
  if (val > 0) {
    return 1
  } else {
    return -1
  }
}
