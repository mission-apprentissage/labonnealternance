"use client"

import { zoneScopedId } from "@/app/_components/zone-ids"
import { SearchHomeForm } from "@/app/(candidat)/(recherche)/recherche/_components/SearchHomeForm"

export function HomeRechercheOptIn() {
  return <SearchHomeForm id={zoneScopedId("home", "search-form")} />
}
