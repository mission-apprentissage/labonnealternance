import { getDistance } from "geolib";

/**
 * @description Returns number of kilometers between two geo points.
 * @param {{origin: {latitude: number, longitude: number}, destination: {latitude: number, longitude: number}} } coordinate - Coordinate of Origin and Destination
 * @returns {number}
 */
export const getDistanceInKm = (coordinate) => {
  const distanceInKm = getDistance(coordinate.origin, coordinate.destination) / 1000;

  return Math.ceil(distanceInKm);
};
