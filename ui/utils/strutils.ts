const isNonEmptyString = (val) => typeof val === "string" && val.trim().length > 0

const capitalizeFirstLetter = (s) => {
  let res = ""
  if (isNonEmptyString(s)) {
    res = s.charAt(0).toUpperCase() + s.toLowerCase().slice(1)
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

  resultDate = new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" })

  return resultDate
}

export { capitalizeFirstLetter, countInstances, endsWithNumber, formatDate, isNonEmptyString }
