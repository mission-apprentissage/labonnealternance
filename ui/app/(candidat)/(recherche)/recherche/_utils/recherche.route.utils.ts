import type { ReadonlyURLSearchParams } from "next/navigation"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, newItemTypeToOldItemType, oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import type { ITypeEmploi } from "shared/constants/recruteur"
import { NIVEAUX_POUR_LBA, TYPE_EMPLOI_OPTIONS } from "shared/constants/recruteur"
// Imports profonds et non via le barrel "shared" : ce module part dans le bundle de
// la home (via le registre PAGES de routes.utils).
import { MAX_SEARCH_ROMES_PRIVATE } from "shared/constants/search"
import { parseEnum } from "shared/utils/enum-utils"
import { typedKeys } from "shared/utils/object-utils"

import type { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/use-recherche-results"
import { PAGES } from "@/utils/routes.utils"

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
  const [rawIdeaType, ...rest] = item.split(":")
  const ideaType = parseEnum(LBA_ITEM_TYPE_OLD, rawIdeaType)
  if (ideaType === null) {
    return null
  }
  return { ideaType: newItemTypeToOldItemType(ideaType), id: rest.join(",") }
}

export function serializeTypesEmploi(typesEmploi: ITypeEmploi[]) {
  return typesEmploi.join(",")
}

function deserializeTypesEmploi(typesEmploiRaw: string | null): ITypeEmploi[] {
  if (!typesEmploiRaw) return []
  return (typesEmploiRaw?.split(",") ?? []).flatMap((typeEmploi) => {
    const enumValue = parseEnum(TYPE_EMPLOI_OPTIONS, typeEmploi)
    return enumValue ? [enumValue] : []
  })
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

// Type explicite, ex-dérivé d'un schéma zod jamais parsé (Required<z.output<...>>) :
// le retrait de zod sort son runtime (~66 ko gzip) du first-load de toutes les pages
// qui chargent le registre PAGES. Mêmes unions que la dérivation d'origine
// (.optional() → requis par Required<>, .nullish() → `| null`).
export type IRecherchePageParams = {
  romes: string[]
  geo: { address: string | null; latitude: number; longitude: number } | null
  radius: number
  diploma: keyof typeof NIVEAUX_POUR_LBA | null
  typesEmploi: ITypeEmploi[] | null
  job_name: string | null
  job_type: string | null
  displayEntreprises: boolean
  displayFormations: boolean
  displayFilters: boolean
  displayMobileForm: boolean
  elligibleHandicapFilter: boolean
  activeItems: ItemReference[]
  opco: string | null
  rncp: string | null
  scrollToRecruteursLba: boolean | null
  viewType?: RechercheViewType
}

export type WithRecherchePageParams<T = object> = T & { rechercheParams: IRecherchePageParams }

const normalizeRomes = (romes: string[]) => romes.slice(0, MAX_SEARCH_ROMES_PRIVATE)

export enum IRechercheMode {
  DEFAULT = "default",
  FORMATIONS_ONLY = "formations-only",
  JOBS_ONLY = "jobs-only",
}

export function buildRecherchePageParams(rechercheParams: Partial<IRecherchePageParams> | null, mode: IRechercheMode | null): string {
  if (rechercheParams === null) return ""
  const query = new URLSearchParams()

  if (rechercheParams?.romes?.length > 0) {
    query.set("romes", normalizeRomes(rechercheParams.romes).join(","))
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
  if (rechercheParams.typesEmploi?.length > 0) {
    query.set("typesEmploi", serializeTypesEmploi(rechercheParams.typesEmploi))
  }
  if (rechercheParams.job_name) {
    query.set("job_name", rechercheParams.job_name)
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
  if (rechercheParams.scrollToRecruteursLba) {
    query.set("scrollToRecruteursLba", "true")
  }

  return query.toString()
}

export function parseRecherchePageParams(search: ReadonlyURLSearchParams | URLSearchParams | null, mode: IRechercheMode): IRecherchePageParams | null {
  if (search === null) {
    return null
  }

  const romes = normalizeRomes(search.get("romes")?.split(",") ?? [])
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
  const typesEmploi = deserializeTypesEmploi(search.get("typesEmploi"))
  const job_name = search.get("job_name") || null
  const job_type = search.get("job_type") || null

  const opco = search.get("opco") || null
  const rncp = search.get("rncp") || null

  const displayMobileForm = search.get("displayMobileForm") === "true"
  const elligibleHandicapFilter = search.get("elligibleHandicapFilter") === "true"
  const scrollToRecruteursLba = search.get("scrollToRecruteursLba") === "true"

  const commonProps = {
    romes,
    geo,
    diploma,
    job_name,
    job_type,
    typesEmploi,
    displayMobileForm,
    elligibleHandicapFilter,
    activeItems,
    opco,
    rncp,
    radius,
    scrollToRecruteursLba,
  } satisfies Partial<IRecherchePageParams>

  if (mode === IRechercheMode.FORMATIONS_ONLY) {
    return {
      ...commonProps,
      displayEntreprises: false,
      displayFormations: true,
      displayFilters: false,
    }
  }

  if (mode === IRechercheMode.JOBS_ONLY) {
    return {
      ...commonProps,
      displayEntreprises: true,
      displayFormations: false,
      displayFilters: false,
    }
  }

  const displayEntreprises = search.get("displayEntreprises") !== "false"
  const displayFormations = search.get("displayFormations") !== "false"
  const displayFilters = search.get("displayFilters") !== "false"

  return {
    ...commonProps,
    displayEntreprises,
    displayFormations,
    displayFilters,
  }
}

export function detectModeFromParams({ displayFilters, displayEntreprises, displayFormations }: IRecherchePageParams): IRechercheMode {
  if (displayFilters) {
    return IRechercheMode.DEFAULT
  }

  if (!displayEntreprises && displayFormations) {
    return IRechercheMode.FORMATIONS_ONLY
  }

  if (displayEntreprises && !displayFormations) {
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
