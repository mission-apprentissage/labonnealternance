"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { useFormationPrdvTracker } from "@/app/hooks/use-formation-prdv-tracker"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ContactCfaSummary } from "@/components/espace_pro/Candidat/layout/ContactCfaSummary"
import { DemandeDeContactConfirmation } from "@/components/RDV/DemandeDeContactConfirmation"
import { DemandeDeContactForm } from "@/components/RDV/DemandeDeContactForm"
import { getPrdvContext } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

type PrdvData = NonNullable<Awaited<ReturnType<typeof getPrdvContext>>>

const PrdvIndisponible = () => (
  <Box id="main-content" tabIndex={-1} sx={{ my: fr.spacing("6v"), mx: fr.spacing("2v") }}>
    <Typography variant="h1">Ce formulaire n'est plus disponible</Typography>
    <Typography sx={{ mt: fr.spacing("4v") }}>
      Le lien que vous avez suivi ne correspond plus à une formation acceptant les demandes de contact. Il a peut-être expiré, ou le centre de formation ne reçoit plus de demandes
      par ce biais.
    </Typography>
    <Typography sx={{ mt: fr.spacing("4v") }}>
      Vous pouvez <DsfrLink href={PAGES.dynamic.rechercheFormation(null).getPath()}>rechercher une autre formation</DsfrLink> et contacter le centre depuis sa fiche.
    </Typography>
  </Box>
)

type Props = {
  data: PrdvData | null
  cleMinistereEducatif: string | null
  referrer: string | null
}

/**
 * Appointment form page.
 */
export default function PriseDeRendezVous({ data, cleMinistereEducatif, referrer }: Props) {
  return <PageContent data={data} cleMinistereEducatif={cleMinistereEducatif} referrer={referrer} />
}

const PageContent = ({ data: initialData, cleMinistereEducatif, referrer }: Props) => {
  // Rescue client-side : si le # n'était pas encodé dans l'URL, le navigateur l'a
  // interprété comme un fragment et le serveur n'a pas reçu la partie "#L01".
  // On détecte ce cas en comparant window.location.hash avec la clé reçue côté serveur.
  const [rescueCleMinistereEducatif, setRescueCleMinistereEducatif] = useState<string | null>(null)
  const [rescueChecked, setRescueChecked] = useState(false)

  useEffect(() => {
    const hash = window.location.hash // ex: "#L01"
    if (hash && cleMinistereEducatif && !initialData) {
      // Le hash ressemble à un suffixe de cleMinistereEducatif (ex: "#L01", "#L05")
      setRescueCleMinistereEducatif(`${cleMinistereEducatif}${hash}`)
    }
    setRescueChecked(true)
  }, [cleMinistereEducatif, initialData])

  const { data: rescuedData, isFetching: isRescueFetching } = useQuery({
    queryKey: ["getPrdvForm-rescue", rescueCleMinistereEducatif],
    queryFn: () => getPrdvContext(rescueCleMinistereEducatif!, referrer ?? "lba"),
    enabled: !!rescueCleMinistereEducatif,
    gcTime: 0,
  })

  const data = initialData ?? rescuedData ?? null

  // Utilise la clé depuis la réponse API (la plus fiable) ou la clé de rescue/url
  const trackingId = data?.cle_ministere_educatif ?? rescueCleMinistereEducatif ?? cleMinistereEducatif ?? ""
  const { setPrdvDone } = useFormationPrdvTracker(trackingId)
  const [confirmation, setConfirmation] = useState<{ appointmentId: string; token: string } | null>(null)

  // Rescue en cours : ne pas afficher le message d'erreur tant que la tentative n'est pas terminée
  if (!data && (!rescueChecked || isRescueFetching)) {
    return null
  }

  // Contexte introuvable : la clé ministère éducatif est inconnue, expirée, ou le CFA ne prend plus
  // de rendez-vous. C'est un état fonctionnel attendu, pas une panne. Le `throw` précédent le
  // faisait remonter à l'ErrorBoundary, qui affichait « Un problème technique est survenu » et
  // capturait un event Sentry par visite — 343 sur 7 jours, 936 depuis le 07/07
  // (LBA-UI-5CVZZZZZZG40G).
  if (!data) {
    return <PrdvIndisponible />
  }

  const context = { cle_ministere_educatif: data.cle_ministere_educatif, etablissement_formateur_entreprise_raison_sociale: data.etablissement_formateur_entreprise_raison_sociale }

  const localOnSuccess = (props: { appointmentId: string; token: string }) => {
    setPrdvDone()
    setConfirmation(props)
  }

  return confirmation ? (
    <DemandeDeContactConfirmation {...confirmation} />
  ) : (
    <Box id="main-content" tabIndex={-1} sx={{ my: fr.spacing("6v"), mx: fr.spacing("2v") }}>
      <ContactCfaSummary
        entrepriseRaisonSociale={data.etablissement_formateur_entreprise_raison_sociale}
        intitule={data.intitule_long}
        adresse={data.lieu_formation_adresse}
        codePostal={data.code_postal}
        ville={data.localite}
      />
      <DemandeDeContactForm context={context} referrer={referrer ?? "lba"} onRdvSuccess={localOnSuccess} />
    </Box>
  )
}
