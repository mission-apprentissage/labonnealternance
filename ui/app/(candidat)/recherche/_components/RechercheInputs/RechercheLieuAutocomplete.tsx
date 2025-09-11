"use client"

import { AutocompleteAsync } from "@/app/_components/FormComponents/AutocompleteAsync"
import { IRechercheForm } from "@/app/_components/RechercheForm/RechercheForm"
import { searchAddress } from "@/services/baseAdresse"

export async function fetchLieuOptions(query: string): Promise<IRechercheForm["lieu"][]> {
  const data = await searchAddress(query)

  return data.map((item) => ({
    label: item.label,
    longitude: item.value.coordinates[0],
    latitude: item.value.coordinates[1],
  }))
}

export function RechercheLieuAutocomplete() {
  return (
    <AutocompleteAsync
      noOptionsText="Nous ne parvenons pas à identifier le lieu que vous cherchez, veuillez reformuler votre recherche"
      id="lieu"
      label="Lieu"
      fetchOptions={fetchLieuOptions}
      getOptionKey={(option) => option.label}
      getOptionLabel={(option) => option.label}
      placeholder="À quel endroit ?"
    />
  )
}
