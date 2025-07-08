"use client"
import { Box, Container, Flex } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Stack, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { IJobJson } from "shared"
import { AUTHTYPE } from "shared/constants/index"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { OffresTabs } from "@/app/(espace-pro)/espace-pro/(connected)/_components/OffresTabs"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Building, Plus } from "@/theme/components/icons"
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
    <Flex>
      {!hideModify && user.type !== AUTHTYPE.OPCO && (
        <Box mr={5}>
          <Button priority="secondary" onClick={() => router.push(PAGES.dynamic.modificationEntreprise(user.type, establishment_id).getPath())}>
            <Building mr={2} /> {user.type === AUTHTYPE.ENTREPRISE ? "Mes informations" : "Modifier l'entreprise"}
          </Button>
        </Box>
      )}
      <Button onClick={navigateToCreation}>
        <Plus mr={2} /> Ajouter une offre
      </Button>
    </Flex>
  )

  if (jobs.length === 0) {
    return (
      <Container maxW="container.xl" my={12}>
        <Flex justify="space-between" align="center" flexWrap="wrap">
          <Typography fontSize="2rem" fontWeight={700}>
            {entrepriseTitle}
          </Typography>
          {ActionButtons}
        </Flex>
        <EmptySpace />
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" my={5} pb={4}>
      <Flex justify="space-between" align="center" flexWrap="wrap">
        <Typography fontSize="2rem" fontWeight={700}>
          {establishment_raison_sociale ?? `SIRET ${establishment_siret}`}
        </Typography>
        {ActionButtons}
      </Flex>
      <Typography fontWeight="700" py={fr.spacing("3w")}>
        Offres de recrutement en alternance
      </Typography>
      <OffresTabs showStats={showStats} recruiter={data} buildOfferEditionUrl={getOffreEditionUrl} />
    </Container>
  )
}

const EmptySpace = () => (
  <Stack direction={{ xs: "column", lg: "row" }} spacing="32px" sx={{ mt: fr.spacing("4w"), py: fr.spacing("5w"), border: "1px solid", borderColor: "grey.400" }}>
    <Flex justify={["center", "center", "center", "flex-end"]} align={["center", "center", "center", "flex-start"]} w={["100%", "100%", "100%", "350px"]} h="150px">
      <Image src="/images/espace_pro/add-offer.svg" width="246" height="170" alt="" />
    </Flex>

    <Box w={["100%", "100%", "100%", "600px"]}>
      <Typography variant="h2" sx={{ mb: fr.spacing("3w") }}>
        Ajoutez votre première offre d’emploi en alternance.
      </Typography>
      <Typography fontSize="1.375rem">
        Décrivez vos besoins de recrutement pour les afficher sur le site <span style={{ fontWeight: "700" }}>La bonne alternance</span> dès aujourd’hui.
      </Typography>
    </Box>
  </Stack>
)
