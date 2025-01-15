import { kebabCase, uniq } from "lodash-es"

export const extractFromFile = (path, fs, txtDirectory, fileName) => {
  const filePath = path.join(txtDirectory, fileName)
  const lineString = fs.readFileSync(filePath, "utf8")
  const arrayOfLines = lineString.match(/[^\r\n]+/g)
  return arrayOfLines
}

export const getStaticMetiers = (path, fs, txtDirectory, stubbedExtractionFunction = null) => {
  const extractionFunction = stubbedExtractionFunction || extractFromFile

  const arrayOfJobLines = extractionFunction(path, fs, txtDirectory, "metiers.txt")

  const dataJobs = arrayOfJobLines.map(function (singleLine) {
    const splitted = singleLine.split("[")
    const actualName = splitted[0].trim()
    const romes = splitted[1].includes(",") ? uniq(splitted[1].slice(0, -1).split(",")) : [splitted[1].slice(0, -1)]

    return {
      name: actualName,
      slug: kebabCase(actualName),
      romes: romes,
    }
  })

  return dataJobs
}

export const getStaticVilles = (path, fs, txtDirectory, stubbedExtractionFunction = null) => {
  const extractionFunction = stubbedExtractionFunction || extractFromFile

  const arrayOfTownLines = extractionFunction(path, fs, txtDirectory, "villes.txt")

  const dataTowns = arrayOfTownLines.map(function (singleLine) {
    const splitted = singleLine.split("/")
    const townName = splitted[0].trim()
    const lon = splitted[4].trim()
    const lat = splitted[5].trim()
    const insee = splitted[2].trim()
    const zip = splitted[1].split("-")[0].trim()
    return {
      slug: kebabCase(townName),
      name: townName,
      lon: lon,
      lat: lat,
      insee: insee,
      zip: zip,
    }
  })

  return dataTowns
}
