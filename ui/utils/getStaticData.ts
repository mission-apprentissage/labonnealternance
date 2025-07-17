import { readFileSync } from "node:fs"
import { join } from "node:path"

import { kebabCase, uniq } from "lodash-es"

const extractFromFile = (txtDirectory: string, fileName: string) => {
  const filePath = join(txtDirectory, fileName)
  const lineString = readFileSync(filePath, "utf8")
  const arrayOfLines = lineString.match(/[^\r\n]+/g)
  return arrayOfLines
}

export type IStaticMetiers = {
  name: string
  slug: string
  romes: string[]
}

export const getStaticMetiers = (txtDirectory: string): IStaticMetiers[] => {
  const arrayOfJobLines = extractFromFile(txtDirectory, "metiers.txt")
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

export type IStaticVilles = {
  slug: string
  name: string
  lon: string
  lat: string
  insee: string
  zip: string
}

export const getStaticVilles = (txtDirectory: string): IStaticVilles[] => {
  const arrayOfTownLines = extractFromFile(txtDirectory, "villes.txt")
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
