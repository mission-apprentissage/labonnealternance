import { Metadata } from "next"

import { RecherchePageComponent } from "@/app/(candidat)/recherche/_components/RecherchePageComponent"
import { parseRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return PAGES.dynamic.rechercheFormation(parseRecherchePageParams(new URLSearchParams(await searchParams), "formations-only")).getMetadata?.() ?? {}
}

export default function RechercheFormationPage() {
  return <RecherchePageComponent />
}
