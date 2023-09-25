import distance from "@turf/distance"
import { round } from "lodash-es"

type Coordinate = {
  origin: { latitude: number; longitude: number }
  destination: { latitude: number; longitude: number }
}

/**
 * Returns number of kilometers between two geo points.
 */
export const getDistanceInKm = (coordinate: Coordinate): number => {
  const distanceInKm = distance(Object.values(coordinate.origin).reverse(), Object.values(coordinate.destination).reverse())

  return Math.ceil(distanceInKm)
}

export const roundDistance = (distance: number, precision = 2): number => round(distance, precision)
