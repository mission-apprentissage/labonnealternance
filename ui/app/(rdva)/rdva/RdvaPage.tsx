"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { useFormationPrdvTracker } from "@/app/hooks/useFormationPrdvTracker"
import { ContactCfaSummary } from "@/components/espace_pro/Candidat/layout/ContactCfaSummary"
import { DemandeDeContactConfirmation } from "@/components/RDV/DemandeDeContactConfirmation"
import { DemandeDeContactForm } from "@/components/RDV/DemandeDeContactForm"
import { getPrdvContext } from "@/utils/api"

type PrdvData = NonNullable<Awaited<ReturnType<typeof getPrdvContext>>>

type Props = {
  data: PrdvData | null
  cleMinistereEducatif: string | null
  referrer: string | null
}

/**
 * Appointment form page.
 */
export default function PriseDeRendezVous({ data, cleMinistereEducatif, referrer }: Props) {
  return (
    <Container disableGutters>
      <PageContent data={data} cleMinistereEducatif={cleMinistereEducatif} referrer={referrer} />
    </Container>
  )
}

const PageContent = ({ data: initialData, cleMinistereEducatif, referrer }: Props) => {
  // Rescue client-side : si le # n'était pas encodé dans l'URL, le navigateur l'a
  // interprété comme un fragment et le serveur n'a pas reçu la partie "#L01".
  // On détecte ce cas en comparant window.location.hash avec la clé reçue côté serveur.
  const [rescueCleMinistereEducatif, setRescueCleMinistereEducatif] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash // ex: "#L01"
    if (hash && cleMinistereEducatif && !initialData) {
      // Le hash ressemble à un suffixe de cleMinistereEducatif (ex: "#L01", "#L05")
      setRescueCleMinistereEducatif(`${cleMinistereEducatif}${hash}`)
    }
  }, [cleMinistereEducatif, initialData])

  const { data: rescuedData } = useQuery({
    queryKey: ["getPrdvForm-rescue", rescueCleMinistereEducatif],
    queryFn: () => getPrdvContext(rescueCleMinistereEducatif!, referrer ?? "lba"),
    enabled: !!rescueCleMinistereEducatif,
    gcTime: 0,
  })

  const data = initialData ?? rescuedData ?? null

  const { setPrdvDone } = useFormationPrdvTracker(rescueCleMinistereEducatif ?? cleMinistereEducatif)
  const [confirmation, setConfirmation] = useState<{ appointmentId: string; token: string } | null>(null)

  if (!data) {
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
    <Box sx={{ my: fr.spacing("6v"), mx: fr.spacing("2v") }}>
      <ContactCfaSummary
        entrepriseRaisonSociale={data.etablissement_formateur_entreprise_raison_sociale}
        intitule={data.intitule_long}
        adresse={data.lieu_formation_adresse}
        codePostal={data.code_postal}
        ville={data.localite}
      />
      <DemandeDeContactForm context={context} referrer={referrer} onRdvSuccess={localOnSuccess} />
    </Box>
  )
}
