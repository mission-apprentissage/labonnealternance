import { ObjectId } from "mongodb"
import type { IPointProperties } from "../models/address.model.js"
import type { ICacheGeolocation } from "../models/cacheGeolocation.model.js"

export function generateFeaturePropertyFixture(data: Partial<IPointProperties> = {}): IPointProperties {
  return {
    label: "label",
    score: 1,
    housenumber: null,
    id: "id",
    banId: null,
    type: "street",
    name: "name",
    postcode: null,
    citycode: null,
    x: 0,
    y: 0,
    city: null,
    municipality: null,
    population: null,
    district: null,
    locality: null,
    context: "contexte",
    importance: 1,
    street: null,
    ...data,
  }
}

export function generateCacheGeolocationFixture(props: Partial<ICacheGeolocation> = {}): ICacheGeolocation {
  return {
    _id: new ObjectId(),
    address: "fake address",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [47, 1],
        },
        properties: generateFeaturePropertyFixture(),
      },
    ],
    ...props,
  }
}
