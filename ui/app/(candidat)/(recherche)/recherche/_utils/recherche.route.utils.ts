import { ReadonlyURLSearchParams } from "next/navigation"
import { typedKeys } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, newItemTypeToOldItemType, oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { NIVEAUX_POUR_LBA } from "shared/constants/recruteur"
import { zDiplomaParam } from "shared/routes/_params"
import { z } from "zod"

import { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
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

export enum RechercheViewType {
  EMPLOI = "EMPLOI",
  FORMATION = "FORMATION",
}

const zRecherchePageParams = z.object({
  romes: z.array(z.string()),
  geo: z
    .object({
      address: z.string().nullable(),
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable(),
  radius: z.number(),
  diploma: zDiplomaParam.nullish(),
  job_name: z.string().nullable(),
  job_type: z.string().nullable(),
  displayMap: z.boolean().optional(),
  displayEntreprises: z.boolean().optional(),
  displayFormations: z.boolean().optional(),
  displayPartenariats: z.boolean().optional(),
  displayFilters: z.boolean().optional(),
  displayMobileForm: z.boolean().optional(),
  elligibleHandicapFilter: z.boolean().optional(),
  activeItems: z
    .object({
      ideaType: z.nativeEnum(LBA_ITEM_TYPE_OLD),
      id: z.string(),
    })
    .array()
    .optional(),
  opco: z.string().nullish(),
  rncp: z.string().nullish(),
})

export type IRecherchePageParams = Required<z.output<typeof zRecherchePageParams>> & { viewType?: RechercheViewType }

export type WithRecherchePageParams<T = object> = T & { rechercheParams: IRecherchePageParams }

export enum IRechercheMode {
  DEFAULT = "default",
  FORMATIONS_ONLY = "formations-only",
  JOBS_ONLY = "jobs-only",
}

export function buildRecherchePageParams(rechercheParams: Partial<IRecherchePageParams> | null, mode: IRechercheMode | null): string {
  if (rechercheParams === null) return ""
  const query = new URLSearchParams()

  if (rechercheParams?.romes?.length > 0) {
    query.set("romes", rechercheParams.romes.join(","))
  }

  if (rechercheParams.radius !== undefined) {
    query.set("radius", rechercheParams.radius.toString())
  }
  if (rechercheParams.geo) {
    const { latitude, longitude } = rechercheParams.geo
    if (latitude !== undefined) {
      query.set("lat", latitude.toString())
    }
    if (longitude !== undefined) {
      query.set("lon", longitude.toString())
    }
    if (rechercheParams.geo.address) {
      query.set("address", rechercheParams.geo.address)
    }
  }

  if (rechercheParams.diploma) {
    query.set("diploma", rechercheParams.diploma)
  }
  if (rechercheParams.job_name) {
    query.set("job_name", rechercheParams.job_name)
  }
  if (rechercheParams.displayMap === true) {
    query.set("displayMap", "true")
  }
  if (rechercheParams?.activeItems?.length > 0) {
    query.set("activeItems", serializeItemReferences(rechercheParams.activeItems))
  }
  if (rechercheParams?.opco) {
    query.set("opco", rechercheParams.opco)
  }
  if (rechercheParams?.rncp) {
    query.set("rncp", rechercheParams.rncp)
  }

  // In mode formations-only & jobs-only theses params cannot be modified
  if (mode === IRechercheMode.DEFAULT) {
    if (rechercheParams.displayEntreprises === false) {
      query.set("displayEntreprises", "false")
    }
    if (rechercheParams.displayFormations === false) {
      query.set("displayFormations", "false")
    }
    if (rechercheParams.displayPartenariats === false) {
      query.set("displayPartenariats", "false")
    }
    if (rechercheParams.displayFilters === false) {
      query.set("displayFilters", "false")
    }
  }

  if (rechercheParams.displayMobileForm === true) {
    query.set("displayMobileForm", "true")
  }
  if (rechercheParams.elligibleHandicapFilter === true) {
    query.set("elligibleHandicapFilter", "true")
  }

  return query.toString()
}

export function buildSearchTitle(rechercheParams: Partial<IRecherchePageParams> | null) {
  let searchTitleContext = ""
  if (rechercheParams?.job_name) {
    searchTitleContext += ` - ${rechercheParams.job_name}`
    if (rechercheParams?.geo?.address) {
      searchTitleContext += ` à ${rechercheParams.geo.address}`
    } else if (rechercheParams?.geo == null) {
      searchTitleContext += ` sur la France entière `
    }
  }
  return searchTitleContext
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
        }
      : null

  const radius = parseInt(search.get("radius") ?? "30", 10)
  const diploma = typedKeys(NIVEAUX_POUR_LBA).find((x) => x === search.get("diploma")) || null
  const job_name = search.get("job_name") || null
  const job_type = search.get("job_type") || null

  const displayMap = search.get("displayMap") === "true"

  const opco = search.get("opco") || null
  const rncp = search.get("rncp") || null

  const displayMobileForm = search.get("displayMobileForm") === "true"
  const elligibleHandicapFilter = search.get("elligibleHandicapFilter") === "true"

  const commonProps = {
    romes,
    geo,
    diploma,
    job_name,
    job_type,
    displayMap,
    displayMobileForm,
    elligibleHandicapFilter,
    activeItems,
    opco,
    rncp,
    radius,
  }

  if (mode === IRechercheMode.FORMATIONS_ONLY) {
    return {
      ...commonProps,
      displayEntreprises: false,
      displayFormations: true,
      displayPartenariats: false,
      displayFilters: false,
    }
  }

  if (mode === IRechercheMode.JOBS_ONLY) {
    return {
      ...commonProps,
      displayEntreprises: true,
      displayFormations: false,
      displayPartenariats: false,
      displayFilters: false,
    }
  }

  const displayEntreprises = search.get("displayEntreprises") !== "false"
  const displayFormations = search.get("displayFormations") !== "false"
  const displayPartenariats = search.get("displayPartenariats") !== "false"
  const displayFilters = search.get("displayFilters") !== "false"

  return {
    ...commonProps,
    displayEntreprises,
    displayFormations,
    displayPartenariats,
    displayFilters,
  }
}

export function detectModeFromParams({ displayFilters, displayEntreprises, displayPartenariats, displayFormations }: IRecherchePageParams): IRechercheMode {
  if (displayFilters) {
    return IRechercheMode.DEFAULT
  }

  if (!displayEntreprises && !displayPartenariats && displayFormations) {
    return IRechercheMode.FORMATIONS_ONLY
  }

  if (displayEntreprises && displayPartenariats && !displayFormations) {
    return IRechercheMode.JOBS_ONLY
  }

  return IRechercheMode.DEFAULT
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
