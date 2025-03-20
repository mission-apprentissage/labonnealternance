import { redirect } from "next/navigation"

import TrainingDetailRendererClient from "@/app/(candidat)/formation/[id]/[intitule-formation]/TrainingDetailRendererClient"
import { apiGet } from "@/utils/api.utils"

export default async function FormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idParam = decodeURIComponent(id)
  const formation = await apiGet("/_private/formations/:id", { params: { id: idParam } })
  if (!formation) redirect("/404")
  const priseDeRendezVous = await apiGet("/_private/appointment", { querystring: { cleMinistereEducatif: formation.training.cleMinistereEducatif, referrer: "lba" } })

  /* @ts-ignore TODO */
  return <TrainingDetailRendererClient training={formation} priseDeRendezVous={priseDeRendezVous} />
}
