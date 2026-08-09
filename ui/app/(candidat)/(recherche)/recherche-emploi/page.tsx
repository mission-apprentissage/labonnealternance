import type { Metadata } from "next"

import { RecherchePageComponentServer } from "@/app/(candidat)/(recherche)/recherche/_components/RecherchePageComponentServer"
import { IRechercheMode, parseRecherchePageParams, RechercheViewType } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

type Props = {
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return PAGES.dynamic.rechercheEmploi(parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.JOBS_ONLY)).getMetadata?.() ?? {}
}

export default async function RechercheEmploiPage({ searchParams }: Props) {
  const rechercheParams = parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.JOBS_ONLY)
  return <RecherchePageComponentServer rechercheParams={{ ...rechercheParams, viewType: RechercheViewType.EMPLOI }} />
}
