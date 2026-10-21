const isNonEmptyString = (val: unknown): val is string => typeof val === "string" && val.trim().length > 0

// See https://stackoverflow.com/a/4009771/2595513
const countInstances = (string: string, word: string) => {
  return string.split(word).length - 1
}

const endsWithNumber = (str: string) => {
  return /[0-9]+$/.test(str)
}

const formatDate = (d: number | string | Date) => {
  let resultDate = ""

  resultDate = new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" })

  return resultDate
}

/** « 1 résultat », « 3 résultats » : `singular` et `plural` peuvent porter l'accord (« lieu proposé »). */
const pluralize = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count > 1 ? plural : singular}`

export { countInstances, endsWithNumber, formatDate, isNonEmptyString, pluralize }
