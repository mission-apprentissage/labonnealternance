import { Metadata } from "next"

import { RecherchePageComponentServer } from "@/app/(candidat)/recherche/_components/RecherchePageComponentServer"
import { parseRecherchePageParams, RechercheViewType } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return PAGES.dynamic.rechercheFormation(parseRecherchePageParams(new URLSearchParams(await searchParams), "formations-only")).getMetadata?.() ?? {}
}

export default async function RechercheFormationPage({ searchParams }: Props) {
  const params = parseRecherchePageParams(new URLSearchParams(await searchParams), "formations-only")
  return <RecherchePageComponentServer params={{ ...params, viewType: RechercheViewType.FORMATION }} />
}
