import type { IAlgolia } from "shared/models/index"

import { getDbCollection } from "@/common/utils/mongodbUtils"

interface ISearchFilters {
  q?: string
  type?: string
  type_filter_label?: string
  contract_type?: string[]
  level?: string
  activity_sector?: string
  organization_name?: string
  latitude?: number
  longitude?: number
  radius: number
  page: number
  hitsPerPage: number
}

interface ISearchFacets {
  type: Record<string, number>
  type_filter_label: Record<string, number>
  contract_type: Record<string, number>
  level: Record<string, number>
  activity_sector: Record<string, number>
  organization_name: Record<string, number>
}

function buildCompoundOperator(filters: ISearchFilters) {
  const { q, type, type_filter_label, contract_type, level, activity_sector, organization_name, latitude, longitude, radius } = filters

  const must: object[] = q ? [{ text: { query: q, path: ["title", "description", "keywords", "organization_name"], fuzzy: { maxEdits: 1 } } }] : []

  const filter: object[] = []

  if (type) {
    filter.push({ equals: { path: "type", value: type } })
  }
  if (type_filter_label) {
    filter.push({ equals: { path: "type_filter_label", value: type_filter_label } })
  }
  if (contract_type?.length) {
    filter.push({ in: { path: "contract_type", value: contract_type } })
  }
  if (level) {
    filter.push({ equals: { path: "level", value: level } })
  }
  if (activity_sector) {
    filter.push({ equals: { path: "activity_sector", value: activity_sector } })
  }
  if (organization_name) {
    filter.push({ equals: { path: "organization_name", value: organization_name } })
  }
  if (latitude !== undefined && longitude !== undefined) {
    filter.push({
      geoWithin: {
        circle: {
          center: { type: "Point", coordinates: [longitude, latitude] },
          radius: radius * 1000,
        },
        path: "location",
      },
    })
  }

  // compound exige au moins une clause — si aucun critère, on utilise exists sur un champ indexé
  if (!must.length && !filter.length) {
    filter.push({ exists: { path: "type" } })
  }

  return { ...(must.length ? { must } : {}), filter }
}

export async function searchAlgolia(params: ISearchFilters): Promise<{
  hits: IAlgolia[]
  nbHits: number
  page: number
  nbPages: number
  facets?: ISearchFacets
}> {
  const { page, hitsPerPage } = params
  const compound = buildCompoundOperator(params)

  const [hits, meta] = await Promise.all([
    getDbCollection("algolia")
      .aggregate<IAlgolia>([
        {
          $search: {
            index: "algolia_search",
            compound,
          },
        },
        {
          $addFields: { _score: { $meta: "searchScore" } },
        },
        {
          $sort: { smart_apply: 1, application_count: 1, _score: -1 },
        },
        { $skip: page * hitsPerPage },
        { $limit: hitsPerPage },
        {
          $unset: "_score",
        },
      ])
      .toArray(),

    getDbCollection("algolia")
      .aggregate<{
        count: { lowerBound: number }
        facet: {
          type: { buckets: { _id: string; count: number }[] }
          type_filter_label: { buckets: { _id: string; count: number }[] }
          contract_type: { buckets: { _id: string; count: number }[] }
          level: { buckets: { _id: string; count: number }[] }
          activity_sector: { buckets: { _id: string; count: number }[] }
          organization_name: { buckets: { _id: string; count: number }[] }
        }
      }>([
        {
          $searchMeta: {
            index: "algolia_search",
            facet: {
              operator: { compound },
              facets: {
                type: { type: "string", path: "type" },
                type_filter_label: { type: "string", path: "type_filter_label" },
                contract_type: { type: "string", path: "contract_type" },
                level: { type: "string", path: "level" },
                activity_sector: { type: "string", path: "activity_sector" },
                organization_name: { type: "string", path: "organization_name", numBuckets: 100 },
              },
            },
          },
        },
      ])
      .toArray(),
  ])

  const metaResult = meta[0]
  const nbHits = metaResult?.count?.lowerBound ?? 0
  const nbPages = Math.ceil(nbHits / hitsPerPage)

  const facets: ISearchFacets | undefined = metaResult?.facet
    ? {
        type: Object.fromEntries(metaResult.facet.type.buckets.map((b) => [b._id, b.count])),
        type_filter_label: Object.fromEntries(metaResult.facet.type_filter_label.buckets.map((b) => [b._id, b.count])),
        contract_type: Object.fromEntries(metaResult.facet.contract_type.buckets.map((b) => [b._id, b.count])),
        level: Object.fromEntries(metaResult.facet.level.buckets.map((b) => [b._id, b.count])),
        activity_sector: Object.fromEntries(metaResult.facet.activity_sector.buckets.map((b) => [b._id, b.count])),
        organization_name: Object.fromEntries(metaResult.facet.organization_name.buckets.map((b) => [b._id, b.count])),
      }
    : undefined

  return { hits, nbHits, page, nbPages, facets }
}
