import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info("20241218-fix-recruiter-missing-geopoint started")
  for await (const { _id, geo_coordinates } of getDbCollection("recruiters").find({ geopoint: null, geo_coordinates: { $ne: null } })) {
    const [latitude, longitude] = geo_coordinates!.split(",").map((coord) => parseFloat(coord))
    await getDbCollection("recruiters").updateOne({ _id }, { $set: { geopoint: { type: "Point", coordinates: [longitude, latitude] } } })
  }
  logger.info("20241218-fix-recruiter-missing-geopoint ended")
}
