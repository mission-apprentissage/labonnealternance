import { ICacheInfosSiret } from "shared/models/cacheInfosSiret.model"

import { deduplicateBy } from "@/common/utils/array"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await updateRecruiters()
  await updateEntreprises()
}

export const requireShutdown: boolean = false

async function updateRecruiters() {
  const documents = (await getDbCollection("recruiters")
    .aggregate([
      {
        $match: {
          $or: [{ naf_code: null }, { naf_label: null }],
        },
      },
      {
        $lookup: {
          from: "cache_siret",
          localField: "establishment_siret",
          foreignField: "siret",
          as: "cache_siret",
        },
      },
      {
        $unwind: {
          path: "$cache_siret",
        },
      },

      {
        $match: {
          cache_siret: { $ne: null },
        },
      },
      {
        $project: {
          establishment_siret: 1,
          "cache_siret.data.data.activite_principale.code": 1,
          "cache_siret.data.data.activite_principale.libelle": 1,
        },
      },
    ])
    .toArray()) as { establishment_siret: string; cache_siret: ICacheInfosSiret }[]
  console.log(documents.length, "documents")

  const triplets = documents.flatMap((document) => {
    const { establishment_siret: siret, cache_siret } = document
    const nafCode = cache_siret.data?.data?.activite_principale?.code
    const nafLabel = cache_siret.data?.data?.activite_principale?.libelle
    if (!nafCode && !nafLabel) return []
    return [
      {
        siret,
        nafCode,
        nafLabel,
      },
    ]
  })
  const uniqueTriplets = deduplicateBy(triplets, (x) => x.siret)
  console.log("unique triplets", uniqueTriplets.length)

  const recruitersUpdates = uniqueTriplets.map(({ siret, nafCode, nafLabel }) => {
    return {
      updateMany: {
        filter: { establishment_siret: siret },
        update: { $set: { naf_code: nafCode, naf_label: nafLabel } },
      },
    }
  })
  if (recruitersUpdates.length) {
    await getDbCollection("recruiters").bulkWrite(recruitersUpdates, { ordered: false })
  }
}

async function updateEntreprises() {
  const documents = (await getDbCollection("entreprises")
    .aggregate([
      {
        $match: {
          $or: [{ naf_code: null }, { naf_label: null }],
        },
      },
      {
        $lookup: {
          from: "cache_siret",
          localField: "siret",
          foreignField: "siret",
          as: "cache_siret",
        },
      },
      {
        $unwind: {
          path: "$cache_siret",
        },
      },

      {
        $match: {
          cache_siret: { $ne: null },
        },
      },
      {
        $project: {
          siret: 1,
          "cache_siret.data.data.activite_principale.code": 1,
          "cache_siret.data.data.activite_principale.libelle": 1,
        },
      },
    ])
    .toArray()) as { siret: string; cache_siret: ICacheInfosSiret }[]

  const triplets = documents.flatMap((document) => {
    const { siret, cache_siret } = document
    const nafCode = cache_siret.data?.data?.activite_principale?.code
    const nafLabel = cache_siret.data?.data?.activite_principale?.libelle
    if (!nafCode && !nafLabel) return []
    return [
      {
        siret,
        nafCode,
        nafLabel,
      },
    ]
  })
  const uniqueTriplets = deduplicateBy(triplets, (x) => x.siret)
  console.log("unique triplets", uniqueTriplets.length)

  const entrepriseUpdates = uniqueTriplets.map(({ siret, nafCode, nafLabel }) => {
    return {
      updateOne: {
        filter: { siret },
        update: { $set: { naf_code: nafCode, naf_label: nafLabel } },
      },
    }
  })
  if (entrepriseUpdates.length) {
    await getDbCollection("entreprises").bulkWrite(entrepriseUpdates, { ordered: false })
  }
}
