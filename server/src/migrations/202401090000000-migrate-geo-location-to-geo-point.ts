import { addJob } from "job-processor"
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

  await db.collection("recruiters").updateMany(
    {
      $and: [{ geo_coordinates: { $ne: null } }, { geo_coordinates: { $ne: "NOT FOUND" } }, { geo_coordinates: { $ne: "anonymized" } }],
    },
    [
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
    ]
  )
  await db.collection("recruiters").updateMany({ "geopoint.coordinates": { $eq: null } }, { $set: { geopoint: { type: "Point", coordinates: [0, 0] } } })

  await addJob({ name: "diplomes-metiers:update", payload: {} })

  await addJob({ name: "domaines-metiers:update", payload: {} })

  await addJob({ name: "mongodb:indexes:create", payload: {} })
}
