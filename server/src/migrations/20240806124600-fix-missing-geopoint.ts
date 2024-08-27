import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("recruiters").updateMany({ geo_coordinates: "NOT FOUND" }, { $set: { geo_coordinates: null } })
  for await (const { _id, geo_coordinates } of getDbCollection("recruiters").find({ geopoint: { $exists: false }, geo_coordinates: { $ne: null } })) {
    const [latitude, longitude] = geo_coordinates!.split(",").map((coord) => parseFloat(coord))
    await getDbCollection("recruiters").updateOne({ _id }, { $set: { geopoint: { type: "Point", coordinates: [longitude, latitude] } } })
  }
}
