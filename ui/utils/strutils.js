import _ from "lodash"

const isNonEmptyString = (val) => _.isString(val) && val.trim().length > 0

const capitalizeFirstLetter = (s) => {
  let res = ""
  if (isNonEmptyString(s)) {
    res = s.charAt(0).toUpperCase() + s.slice(1)
  }
  return res
}

// See https://stackoverflow.com/a/4009771/2595513
const countInstances = (string, word) => {
  return string.split(word).length - 1
}

const endsWithNumber = (str) => {
  return /[0-9]+$/.test(str)
}

const formatDate = (d) => {
  let resultDate = ""

  try {
    resultDate = new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" })
  } catch (err) {}

  return resultDate
}

export { isNonEmptyString, capitalizeFirstLetter, formatDate, countInstances, endsWithNumber }
