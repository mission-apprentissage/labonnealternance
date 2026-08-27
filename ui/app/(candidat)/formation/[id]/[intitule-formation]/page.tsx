import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import type { Metadata } from "next"
import { cacheLife, cacheTag } from "next/cache"
import { notFound } from "next/navigation"
import { buildTrainingUrl } from "shared/metier/lbaitemutils"
import { WidgetAwareHeader } from "@/app/_components/WidgetAwareHeader"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { TrainingSchema } from "@/components/ItemDetail/TrainingSchema"
import { ApiError, apiGet } from "@/utils/api.utils"
import TrainingDetailRendererClient from "./TrainingDetailRendererClient"

async function getFormationOption(id: string) {
  // `apiGet` lit toujours `headers()` en interne (pour transmettre le cookie de session),
  // ce qui est interdit dans un `"use cache"` classique — seul `"use cache: private"` l'autorise
  // (cache navigateur uniquement, jamais côté serveur).
  "use cache: private"
  cacheTag(`formation:${id}`)
  cacheLife("minutes")

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

  // `training`/`title` sont nullish dans le schéma partagé et toKebabCase(null) throw :
  // sans titre, on omet la canonical plutôt que de faire échouer generateMetadata.
  const trainingTitle = formation?.training?.title

  return {
    title: trainingTitle ? `Formation de ${trainingTitle} - La bonne alternance` : "Formation en alternance - La bonne alternance",
    ...(trainingTitle
      ? {
          alternates: {
            // URL canonique sans query params : une même formation accessible avec des paramètres de recherche
            // ou de tracking différents ne doit compter que comme une seule page pour les moteurs.
            // Relative, résolue en absolu par le metadataBase du layout racine (convention du codebase).
            canonical: buildTrainingUrl(idParam, trainingTitle),
          },
        }
      : {}),
  }
}

export default async function FormationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params
  const idParam = decodeURIComponent(id)
  const formation = await getFormationOption(idParam)
  if (!formation) notFound()

  return (
    <>
      {/* Rendu dans le server component pour que le JSON-LD soit présent dans le HTML initial, visible des crawlers sans JavaScript. */}
      <TrainingSchema formation={formation} id={idParam} />
      <SkipLinks
        links={[
          { label: "En-tête", anchor: "#detail-header" },
          { label: "Contenu", anchor: "#detail-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <WidgetAwareHeader />
      <TrainingDetailRendererClient training={formation} rechercheParams={parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)} />
    </>
  )
}
