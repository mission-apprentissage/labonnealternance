import RendezVousApprentissageDetailRendererClient from "@/app/(espace-pro)/espace-pro/(connected)/administration/rendez-vous-apprentissage/[siret]/RendezVousApprentissageDetailRendererClient"
import { getEligibleTrainingsForAppointments, getEtablissement } from "@/utils/api"

export default async function RendezVousApprentissageDetail({ params }: { params: Promise<{ siret: string }> }) {
  const { siret } = await params

  const [formation, etablissement] = await Promise.all([getEligibleTrainingsForAppointments(siret), getEtablissement(siret)])

  return <RendezVousApprentissageDetailRendererClient eligibleTrainingsForAppointmentResult={formation} etablissement={etablissement} />
}
