"use client"

import { type IMetierEnrichi } from "shared"

import { AutocompleteAsync } from "@/app/_components/FormComponents/AutocompleteAsync"
import { IRechercheForm } from "@/app/_components/RechercheForm/RechercheForm"
import { apiGet } from "@/utils/api.utils"

export type IRomeSearchOption = IRechercheForm["metier"] & { group?: string }

async function fetchRomeSearchOptions(query: string): Promise<IRomeSearchOption[]> {
  const data = await apiGet("/rome", { querystring: { title: query } })

  /* @ts-ignore TODO */
  const metiers: IMetierEnrichi[] = data.labelsAndRomes ?? []
  /* @ts-ignore TODO */
  const diplomes: IMetierEnrichi[] = data.labelsAndRomesForDiplomas ?? []

  return [
    ...metiers.slice(0, 4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Métiers" })),
    ...diplomes.slice(0, 4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Formations" })),
    ...metiers.slice(4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Autres Métiers" })),
    ...diplomes.slice(4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Autres Formations" })),
  ]
}

export function RechercheMetierAutocomplete() {
  return (
    <AutocompleteAsync
      noOptionsText="Nous ne parvenons pas à identifier le métier ou la formation que vous cherchez, veuillez reformuler votre recherche"
      id="metier"
      key="metier"
      label="Métier ou formation *"
      fetchOptions={fetchRomeSearchOptions}
      getOptionKey={(option) => `${option.type}:${option.label}`}
      getOptionLabel={(option) => option.label}
      groupBy={(option: IRomeSearchOption) => option.group}
      placeholder="Indiquer un métier ou une formation"
    />
  )
}
