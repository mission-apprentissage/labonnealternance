import { Metadata } from "next"

import { RecherchePageComponent } from "@/app/(candidat)/recherche/_components/RecherchePageComponent"
import { parseRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return PAGES.dynamic.recherche(parseRecherchePageParams(new URLSearchParams(await searchParams), "default")).getMetadata?.() ?? {}
}

export default function RecherchePage() {
  return <RecherchePageComponent />
}
