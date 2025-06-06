import { Metadata } from "next"

import { RecherchePageComponent } from "@/app/(candidat)/recherche/_components/RecherchePageComponent"
import { parseRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return PAGES.dynamic.rechercheEmploi(parseRecherchePageParams(new URLSearchParams(await searchParams), "jobs-only")).getMetadata?.() ?? {}
}

export default async function RechercheEmploiPage({ searchParams }: Props) {
  const params = parseRecherchePageParams(new URLSearchParams(await searchParams), "jobs-only")
  return <RecherchePageComponent params={params} />
}
