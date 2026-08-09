import type { Metadata } from "next"

import { RecherchePageComponentServer } from "@/app/(candidat)/(recherche)/recherche/_components/RecherchePageComponentServer"
import { IRechercheMode, parseRecherchePageParams, RechercheViewType } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return PAGES.dynamic.rechercheFormation(parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.FORMATIONS_ONLY)).getMetadata?.() ?? {}
}

export default async function RechercheFormationPage({ searchParams }: Props) {
  const rechercheParams = parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.FORMATIONS_ONLY)
  return <RecherchePageComponentServer rechercheParams={{ ...rechercheParams, viewType: RechercheViewType.FORMATION }} />
}
