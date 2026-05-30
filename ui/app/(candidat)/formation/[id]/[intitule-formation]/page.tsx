import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { ApiError, apiGet } from "@/utils/api.utils"
import TrainingDetailRendererClient from "./TrainingDetailRendererClient"

async function getFormationOption(id: string) {
  try {
    const formation = await apiGet("/_private/formations/:id", { params: { id } })
    return formation
  } catch (err) {
    if (err && err instanceof ApiError && err.context.statusCode === 404) {
      return null
    }
    throw err
  }
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params
  const idParam = decodeURIComponent(id)
  const formation = await getFormationOption(idParam)

  if (!formation) return { title: "Offre de formation introuvable" }

  return {
    title: `Formation de ${formation?.training?.title} - La bonne alternance`,
  }
}

export default async function FormationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params
  const idParam = decodeURIComponent(id)
  const formation = await getFormationOption(idParam)
  if (!formation) redirect("/404")

  return (
    <>
      <SkipLinks
        links={[
          { label: "En-tête", anchor: "#detail-header" },
          { label: "Contenu", anchor: "#detail-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <PublicHeaderStatic />
      <TrainingDetailRendererClient training={formation} rechercheParams={parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)} />
    </>
  )
}
