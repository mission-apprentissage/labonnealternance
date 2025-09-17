import { Metadata } from "next"
import { redirect } from "next/navigation"

import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import TrainingDetailRendererClient from "@/app/(candidat)/formation/[id]/[intitule-formation]/TrainingDetailRendererClient"
import { apiGet } from "@/utils/api.utils"

export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params
  const idParam = decodeURIComponent(id)
  const formation = await apiGet("/_private/formations/:id", { params: { id: idParam } })

  if (!formation) return { title: "Offre de formation introuvable" }

  return {
    title: `Formation de ${formation?.training?.title} - La bonne alternance`,
  }
}

export default async function FormationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params
  const idParam = decodeURIComponent(id)
  const formation = await apiGet("/_private/formations/:id", { params: { id: idParam } })
  if (!formation) redirect("/404")

  return <TrainingDetailRendererClient training={formation} rechercheParams={parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)} />
}
