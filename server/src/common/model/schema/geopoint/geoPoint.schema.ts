import { Schema } from "../../../mongodb"

export const geoPointSchema = new Schema<{
  type: string
  coordinates: number[]
}>({
  _id: false,
  type: { type: String, default: "Point" },
  coordinates: {
    type: [Number],
    default: [],
    description: "Coordonnées [longitude,latitude] du point",
  },
})
