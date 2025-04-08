import { IPointProperties } from "../models/address.model.js"

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
