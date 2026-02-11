"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { useFormationPrdvTracker } from "@/app/hooks/useFormationPrdvTracker"
import { ContactCfaSummary } from "@/components/espace_pro/Candidat/layout/ContactCfaSummary"
import { DemandeDeContactConfirmation } from "@/components/RDV/DemandeDeContactConfirmation"
import { DemandeDeContactForm } from "@/components/RDV/DemandeDeContactForm"
import { getPrdvContext } from "@/utils/api"

/**
 * Appointment form page.
 */
export default function PriseDeRendezVous() {
  const searchParams = useSearchParams()
  const cleMinistereEducatif = searchParams.get("cleMinistereEducatif")
  const referrer = searchParams.get("referrer")

  return (
    <Container disableGutters>
      <PageContent cleMinistereEducatif={cleMinistereEducatif} referrer={referrer} />
    </Container>
  )
}

const PageContent = ({ cleMinistereEducatif, referrer }: { cleMinistereEducatif: string; referrer: string }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["getPrdvForm", cleMinistereEducatif],
    queryFn: () => getPrdvContext(cleMinistereEducatif, referrer),
    enabled: !!cleMinistereEducatif,
    gcTime: 0,
  })

  const { setPrdvDone } = useFormationPrdvTracker(cleMinistereEducatif)
  const [confirmation, setConfirmation] = useState<{ appointmentId: string; token: string } | null>(null)

  if (isLoading) return <LoadingEmptySpace />

  if (isError || !data) {
    return <Box sx={{ my: "5rem", textAlign: "center" }}>La prise de rendez-vous n'est pas disponible pour cette formation.</Box>
  }

  const context = { cle_ministere_educatif: data.cle_ministere_educatif, etablissement_formateur_entreprise_raison_sociale: data.etablissement_formateur_entreprise_raison_sociale }

  const localOnSuccess = (props: { appointmentId: string; token: string }) => {
    setPrdvDone()
    setConfirmation(props)
  }

  return confirmation ? (
    <DemandeDeContactConfirmation {...confirmation} />
  ) : (
    <Box sx={{ my: fr.spacing("3w") }}>
      <ContactCfaSummary
        entrepriseRaisonSociale={data?.etablissement_formateur_entreprise_raison_sociale}
        intitule={data?.intitule_long}
        adresse={data?.lieu_formation_adresse}
        codePostal={data?.code_postal}
        ville={data?.localite}
      />
      <DemandeDeContactForm context={context} referrer={referrer} onRdvSuccess={localOnSuccess} />
    </Box>
  )
}
