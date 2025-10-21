"use client"

import { Box } from "@mui/material"
import { type IMetierEnrichi } from "shared"

import { AutocompleteAsync } from "@/app/_components/FormComponents/AutocompleteAsync"
import { IRechercheForm } from "@/app/_components/RechercheForm/RechercheForm"
import { apiGet } from "@/utils/api.utils"
import { SendPlausibleEvent } from "@/utils/plausible"

export type IRomeSearchOption = IRechercheForm["metier"] & { group?: string }

async function fetchRomeSearchOptions(query: string): Promise<IRomeSearchOption[]> {
  const data = await apiGet("/rome", { querystring: { title: query } })

  /* @ts-ignore TODO */
  const metiers: IMetierEnrichi[] = data.labelsAndRomes ?? []
  /* @ts-ignore TODO */
  const diplomes: IMetierEnrichi[] = data.labelsAndRomesForDiplomas ?? []

  const res = [
    ...metiers.slice(0, 4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Métiers" })),
    ...diplomes.slice(0, 4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Formations" })),
    ...metiers.slice(4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Autres Métiers" })),
    ...diplomes.slice(4).map((item: IMetierEnrichi) => ({ romes: item.romes, type: item.type, label: item.label, group: "Autres Formations" })),
  ]

  if (query.length > 2) {
    if (!res.length) {
      SendPlausibleEvent("Mots clefs ne retournant aucun résultat", { terme: query.toLowerCase() })
    }
  }

  return res
}

export function RechercheMetierAutocomplete() {
  return (
    <Box id="search-form">
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
    </Box>
  )
}
