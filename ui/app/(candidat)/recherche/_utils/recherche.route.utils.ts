import { ReadonlyURLSearchParams } from "next/navigation"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, newItemTypeToOldItemType, oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { z } from "zod"

import { ILbaItem } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { PAGES } from "@/utils/routes.utils"

const zIdeaType = z.nativeEnum(LBA_ITEM_TYPE_OLD)

type ItemReference = {
  id: string
  ideaType: LBA_ITEM_TYPE_OLD
}

export type ItemReferenceLike = Readonly<Partial<ItemReference> | Pick<ILbaItem, "id" | "ideaType">>

export function serializeItemReferences(items: ItemReferenceLike[]) {
  return items.map(serializeItemReference).join(",")
}

function serializeItemReference(item: ItemReferenceLike) {
  return encodeURIComponent(`${newItemTypeToOldItemType(item.ideaType)}:${item.id}`)
}

export function deserializeItemReferences(items: string): ItemReference[] {
  return decodeURIComponent(items).split(",").map(deserializeItemReference).filter(Boolean)
}

function deserializeItemReference(item: string): ItemReference | null {
  try {
    const [ideaType, ...rest] = item.split(":")
    return { ideaType: newItemTypeToOldItemType(zIdeaType.parse(ideaType)), id: rest.join(",") }
  } catch (e) {
    return null
  }
}

export function getItemReference(item: ItemReferenceLike): ItemReference {
  return {
    id: item.id,
    ideaType: newItemTypeToOldItemType(item.ideaType),
  }
}

function areItemReferencesEqual(a: ItemReferenceLike, b: ItemReferenceLike) {
  return a.id === b.id && newItemTypeToOldItemType(a.ideaType) === newItemTypeToOldItemType(b.ideaType)
}

export function isItemReferenceInList(item: ItemReferenceLike, list: ItemReferenceLike[]) {
  return list.some((ref) => areItemReferencesEqual(ref, item))
}

const zRecherchePageParams = z.object({
  romes: z.array(z.string()),
  geo: z
    .object({
      address: z.string().nullable(),
      latitude: z.number(),
      longitude: z.number(),
      radius: z.number(),
    })
    .nullable(),
  diploma: z.string().nullable(),
  job_name: z.string().nullable(),
  job_type: z.string().nullable(),
  displayMap: z.boolean().optional(),
  displayEntreprises: z.boolean().optional(),
  displayFormations: z.boolean().optional(),
  displayPartenariats: z.boolean().optional(),
  displayFilters: z.boolean().optional(),
  activeItems: z
    .object({
      ideaType: z.nativeEnum(LBA_ITEM_TYPE_OLD),
      id: z.string(),
    })
    .array()
    .optional(),
})

export type IRecherchePageParams = Required<z.output<typeof zRecherchePageParams>>

export type WithRecherchePageParams<T = object> = T & { params: IRecherchePageParams }

export type IRechercheMode = "default" | "formations-only" | "jobs-only"

export function buildRecherchePageParams(params: Partial<IRecherchePageParams>, mode: IRechercheMode | null): string {
  const query = new URLSearchParams()

  if (params?.romes?.length > 0) {
    query.set("romes", params.romes.join(","))
  }

  if (params.geo) {
    query.set("lat", params.geo.latitude.toString())
    query.set("lon", params.geo.longitude.toString())
    query.set("radius", params.geo.radius.toString())

    if (params.geo.address) {
      query.set("address", params.geo.address)
    }
  }

  if (params.diploma) {
    query.set("diploma", params.diploma)
  }
  if (params.job_name) {
    query.set("job_name", params.job_name)
  }
  if (params.displayMap === true) {
    query.set("displayMap", "true")
  }
  if (params?.activeItems?.length > 0) {
    query.set("activeItems", serializeItemReferences(params.activeItems))
  }

  // In mode formations-only & jobs-only theses params cannot be modified
  if (mode === "default") {
    if (params.displayEntreprises === false) {
      query.set("displayEntreprises", "false")
    }
    if (params.displayFormations === false) {
      query.set("displayFormations", "false")
    }
    if (params.displayPartenariats === false) {
      query.set("displayPartenariats", "false")
    }
    if (params.displayFilters === false) {
      query.set("displayFilters", "false")
    }
  }

  return query.toString()
}

export function parseRecherchePageParams(search: ReadonlyURLSearchParams | URLSearchParams | null, mode: IRechercheMode): IRecherchePageParams | null {
  if (search === null) {
    return null
  }

  const romes = search.get("romes")?.split(",") ?? []
  const activeItems = deserializeItemReferences(search.get("activeItems") ?? "")

  const rawLat = search.get("lat")
  const rawLon = search.get("lon")

  const geo =
    rawLat && rawLon
      ? {
          address: search.get("address") ?? null,
          latitude: parseFloat(rawLat),
          longitude: parseFloat(rawLon),
          radius: parseInt(search.get("radius") ?? "30"),
        }
      : null

  const diploma = search.get("diploma") || null
  const job_name = search.get("job_name") || null
  const job_type = search.get("job_type") || null

  const displayMap = search.get("displayMap") === "true"

  if (mode === "formations-only") {
    return {
      romes,
      geo,
      diploma,
      job_name,
      job_type,
      displayMap,
      activeItems,
      displayEntreprises: false,
      displayFormations: true,
      displayPartenariats: false,
      displayFilters: false,
    }
  }

  if (mode === "jobs-only") {
    return {
      romes,
      geo,
      diploma,
      job_name,
      job_type,
      displayMap,
      activeItems,
      displayEntreprises: true,
      displayFormations: false,
      displayPartenariats: true,
      displayFilters: false,
    }
  }

  const displayEntreprises = search.get("displayEntreprises") !== "false"
  const displayFormations = search.get("displayFormations") !== "false"
  const displayPartenariats = search.get("displayPartenariats") !== "false"
  const displayFilters = search.get("displayFilters") !== "false"

  return { romes, geo, diploma, job_name, job_type, activeItems, displayMap, displayEntreprises, displayFormations, displayPartenariats, displayFilters }
}

export function detectModeFromParams(params: IRecherchePageParams): IRechercheMode {
  if (params.displayFilters) {
    return "default"
  }

  if (!params.displayEntreprises && !params.displayPartenariats && params.displayFormations) {
    return "formations-only"
  }

  if (params.displayEntreprises && params.displayPartenariats && !params.displayFormations) {
    return "jobs-only"
  }

  return "default"
}

export function getResultItemUrl(item: ItemReferenceLike, searchParams: Partial<IRecherchePageParams> = {}): string {
  const type = oldItemTypeToNewItemType(item.ideaType)
  if (type === LBA_ITEM_TYPE.FORMATION) {
    return PAGES.dynamic
      .formationDetail({
        jobId: item.id,
        ...searchParams,
      })
      .getPath()
  }

  return PAGES.dynamic
    .jobDetail({
      type: type,
      jobId: item.id,
      ...searchParams,
    })
    .getPath()
}
