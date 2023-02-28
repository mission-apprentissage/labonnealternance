import distance from "@turf/distance"
import { round } from "lodash-es"

/**
 * @description Returns number of kilometers between two geo points.
 * @param {{origin: {latitude: number, longitude: number}, destination: {latitude: number, longitude: number}} } coordinate - Coordinate of Origin and Destination
 * @returns {number}
 */
export const getDistanceInKm = (coordinate) => {
  const distanceInKm = distance(Object.values(coordinate.origin).reverse(), Object.values(coordinate.destination).reverse())

  return Math.ceil(distanceInKm)
}

export const roundDistance = ({ number, precision = 2 }: { number: number; precision?: number }): number => round(number, precision)
