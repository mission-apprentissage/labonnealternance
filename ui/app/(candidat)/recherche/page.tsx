"use server"

import { Metadata } from "next"
import { permanentRedirect } from "next/navigation"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { RecherchePageComponent } from "@/app/(candidat)/recherche/_components/RecherchePageComponent"
import { parseRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return PAGES.dynamic.recherche(parseRecherchePageParams(new URLSearchParams(await searchParams), "default")).getMetadata?.() ?? {}
}

export default async function RecherchePage({ searchParams }: Props) {
  const urlSearchParams = new URLSearchParams(await searchParams)
  // TODO A supprimer à partir du 12/07/2025
  // redirection des anciennes urls de type https://labonnealternance.apprentissage.beta.gouv.fr/recherche?&type=matcha&itemId=67cb12fe3a8f0f83ab4bdd23
  if (urlSearchParams.get("type") === "matcha" && urlSearchParams.get("itemId")) {
    permanentRedirect(PAGES.dynamic.jobDetail({ type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, jobId: urlSearchParams.get("itemId") }).getPath())
  }
  const params = parseRecherchePageParams(urlSearchParams, "default")
  return <RecherchePageComponent params={params} />
}
