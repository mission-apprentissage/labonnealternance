import { Db } from "mongodb"

export const up = async (db: Db) => {
  await db.collection("bonnesboites").updateMany({}, [
    {
      $set: {
        geopoint: {
          type: "Point",
          coordinates: {
            $map: {
              input: { $reverseArray: { $split: ["$geo_coordinates", ","] } },
              as: "coord",
              in: { $toDouble: "$$coord" },
            },
          },
        },
      },
    },
  ])

  await db.collection("bonnesboites").createIndex({ geopoint: "2dsphere" })
}
