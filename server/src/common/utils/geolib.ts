import distance from "@turf/distance"
import { round } from "lodash-es"
import { IGeoPoint } from "shared/models/address.model"

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

export const convertStringCoordinatesToGeoPoint = (coordinates: string): IGeoPoint => {
  const coords = coordinates.split(",")

  return {
    type: "Point",
    coordinates: [parseFloat(coords[1]), parseFloat(coords[0])],
  }
}
