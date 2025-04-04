import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import RendezVousApprentissageDetailRendererClient from "@/app/(espace-pro)/espace-pro/(connected)/administration/rendez-vous-apprentissage/[siret]/RendezVousApprentissageDetailRendererClient"
import { getEligibleTrainingsForAppointments, getEtablissement } from "@/utils/api"

export default async function RendezVousApprentissageDetail({ params }: { params: Promise<{ siret: string }> }) {
  const { siret } = await params

  const [formation, etablissement] = await Promise.allSettled([getEligibleTrainingsForAppointments(siret), getEtablissement(siret)])

  if (formation.status !== "fulfilled" && etablissement.status !== "fulfilled") {
    return <LoadingEmptySpace />
  }

  return (
    <RendezVousApprentissageDetailRendererClient
      eligibleTrainingsForAppointmentResult={formation.status === "fulfilled" ? formation.value : null}
      etablissement={etablissement.status === "fulfilled" ? etablissement.value : null}
    />
  )
}
