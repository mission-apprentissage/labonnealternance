"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, Stack, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { IJobJson } from "shared"
import { AUTHTYPE } from "shared/constants/index"

import { OffresTabs } from "./OffresTabs"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Plus } from "@/theme/components/icons"
import { getFormulaire } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export default function ListeOffres({ hideModify = false, showStats = false, establishment_id }: { hideModify?: boolean; showStats?: boolean; establishment_id: string }) {
  const router = useRouter()
  const { user } = useConnectedSessionClient()

  dayjs.extend(relativeTime)

  const { data, isLoading, error } = useQuery({
    queryKey: ["offre-liste"],
    enabled: !!establishment_id,
    queryFn: () => getFormulaire(establishment_id),
  })

  if (isLoading || !establishment_id) {
    return <LoadingEmptySpace label="Chargement en cours..." />
  }

  if (error) {
    throw error
  }

  const { establishment_raison_sociale, establishment_siret } = data
  /* @ts-ignore TODO */
  const jobs: (IJobJson & { candidatures: number })[] = data.jobs ?? []

  const entrepriseTitle = establishment_raison_sociale ?? establishment_siret
  const getOffreEditionUrl = (offerId: string) => {
    return PAGES.dynamic.offreUpsert({ offerId, establishment_id, userType: user.type }).getPath()
  }

  const navigateToCreation = () => {
    router.push(PAGES.dynamic.offreUpsert({ offerId: "creation", establishment_id, userType: user.type, raison_sociale: entrepriseTitle }).getPath())
  }

  const ActionButtons = (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {!hideModify && user.type !== AUTHTYPE.OPCO && (
        <Box
          sx={{
            mr: fr.spacing("6v"),
          }}
        >
          <Button priority="secondary" onClick={() => router.push(PAGES.dynamic.modificationEntreprise(user.type, establishment_id).getPath())}>
            {user.type === AUTHTYPE.ENTREPRISE ? (
              <>
                <Typography mr={fr.spacing("2v")} className={fr.cx("fr-icon-hotel-line")} />
                Mes informations
              </>
            ) : (
              <>
                <Typography mr={fr.spacing("2v")} className={fr.cx("fr-icon-user-line")} />
                Modifier l'entreprise
              </>
            )}
          </Button>
        </Box>
      )}
      <Button onClick={navigateToCreation}>
        <Plus sx={{ mr: fr.spacing("2v") }} /> Ajouter une offre
      </Button>
    </Box>
  )

  if (jobs.length === 0) {
    return (
      <Box sx={{ width: "100%", maxWidth: "1280px", my: fr.spacing("3v"), px: fr.spacing("4v") }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <Typography
            sx={{
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            {entrepriseTitle}
          </Typography>
          {ActionButtons}
        </Box>
        <EmptySpace />
      </Box>
    )
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "1280px", my: fr.spacing("3v"), px: fr.spacing("4v") }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Typography
          sx={{
            fontSize: "2rem",
            fontWeight: 700,
          }}
        >
          {establishment_raison_sociale ?? `SIRET ${establishment_siret}`}
        </Typography>
        {ActionButtons}
      </Box>
      <OffresTabs caption="Offres de recrutement en alternance" showStats={showStats} recruiter={data} buildOfferEditionUrl={getOffreEditionUrl} />
    </Box>
  )
}

const EmptySpace = () => (
  <Stack direction={{ xs: "column", lg: "row" }} spacing="32px" sx={{ mt: fr.spacing("8v"), py: fr.spacing("10v"), border: "1px solid", borderColor: "grey.400" }}>
    <Box
      sx={{
        width: { xs: "100%", lg: "350px" },
        height: "150px",
        display: "flex",
        justifyContent: { xs: "center", lg: "flex-end" },
        align: { xs: "center", lg: "flex-start" },
      }}
    >
      <Image src="/images/espace_pro/add-offer.svg" width="246" height="170" alt="" />
    </Box>

    <Box
      sx={{
        px: { xs: fr.spacing("4v") },
        width: { xs: "100%", lg: "600px" },
      }}
    >
      <Typography variant="h2" sx={{ mb: fr.spacing("6v") }}>
        Ajoutez votre première offre d’emploi en alternance.
      </Typography>
      <Typography>
        Décrivez vos besoins de recrutement pour les afficher sur le site <span style={{ fontWeight: "700" }}>La bonne alternance</span> dès aujourd’hui.
      </Typography>
    </Box>
  </Stack>
)
