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

  await db.collection("formationcatalogues").updateMany({}, [
    {
      $set: {
        lieu_formation_geopoint: {
          type: "Point",
          coordinates: {
            $map: {
              input: { $reverseArray: { $split: ["$lieu_formation_geo_coordonnees", ","] } },
              as: "coord",
              in: { $toDouble: "$$coord" },
            },
          },
        },
      },
    },
  ])

  await db.collection("formationcatalogues").createIndex({ lieu_formation_geopoint: "2dsphere" })
}
