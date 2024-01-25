import { Db } from "mongodb"

import { addJob } from "@/jobs/jobs_actions"

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

  await db.collection("recruiters").updateMany({ geo_coordinates: "anonymized" }, [
    {
      $set: {
        geo_coordinates: "0,0",
      },
    },
  ])

  await db.collection("recruiters").updateMany({}, [
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
  await db.collection("recruiters").updateMany({ "geopoint.coordinates": { $eq: null } }, { $set: { geopoint: { type: "Point", coordinates: [0, 0] } } })

  await addJob({ name: "diplomes-metiers:update", payload: {} })

  await addJob({ name: "domaines-metiers:update", payload: {} })

  await addJob({ name: "mongodb:indexes:create", payload: {} })
}
