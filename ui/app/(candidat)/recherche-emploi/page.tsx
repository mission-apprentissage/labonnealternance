import { Metadata } from "next"

import { RecherchePageComponentServer } from "@/app/(candidat)/recherche/_components/RecherchePageComponentServer"
import { IRechercheMode, parseRecherchePageParams, RechercheViewType } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

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
