"use client"
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Container, Flex, Heading, Image, Stack, Text } from "@chakra-ui/react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useRouter, useParams } from "next/navigation"
import { useQuery } from "react-query"
import { IJobJson } from "shared"
import { AUTHTYPE } from "shared/constants/index"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { OffresTabs } from "@/app/(espace-pro)/espace-pro/(connected)/_components/OffresTabs"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { ArrowDropRightLine, Building, Plus } from "@/theme/components/icons"
import { getFormulaire } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export default function ListeOffres({ hideModify = false, showStats = false }: { hideModify?: boolean; showStats?: boolean }) {
  const router = useRouter()
  const { user } = useConnectedSessionClient()

  dayjs.extend(relativeTime)

  const { establishment_id } = useParams() as { establishment_id?: string }
  const { data, isLoading, error } = useQuery("offre-liste", {
    enabled: !!establishment_id,
    queryFn: () => getFormulaire(establishment_id),
  })

  if (isLoading || !establishment_id) {
    return <LoadingEmptySpace label="Chargement en cours..." />
  }

  if (error) {
    throw error
  }

  const { establishment_raison_sociale, establishment_siret, _id: dataId } = data
  const jobs: (IJobJson & { candidatures: number })[] = data.jobs ?? []

  const entrepriseTitle = establishment_raison_sociale ?? establishment_siret
  const getOffreEditionUrl = (offerId: string) => {
    return PAGES.dynamic.offreCreation({ offerId, establishment_id, userType: user.type }).getPath()
  }

  const navigateToCreation = () => {
    router.push(PAGES.dynamic.offreCreation({ offerId: "creation", establishment_id, userType: user.type, raison_sociale: entrepriseTitle }).getPath())
  }

  const shouldDisplayModifyButton = !hideModify && user.type !== AUTHTYPE.CFA
  const ActionButtons = (
    <Box>
      {shouldDisplayModifyButton && user.type !== AUTHTYPE.OPCO && (
        <Button mr={5} variant="secondary" leftIcon={<Building />} onClick={() => router.push(PAGES.dynamic.modificationEntreprise(establishment_id).getPath())}>
          {user.type === AUTHTYPE.ENTREPRISE ? "Mes informations" : "Modifier l'entreprise"}
        </Button>
      )}
      <Button variant="primary" leftIcon={<Plus />} onClick={navigateToCreation}>
        Ajouter une offre
      </Button>
    </Box>
  )

  if (jobs.length === 0) {
    return (
      <Container maxW="container.xl" my={12}>
        <Flex justify="space-between" align="center">
          <Text fontSize="2rem" fontWeight={700}>
            {entrepriseTitle}
          </Text>
          {ActionButtons}
        </Flex>
        <EmptySpace />
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" my={5}>
      <Box mb={5}>
        <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
          {user.type === AUTHTYPE.OPCO && (
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => router.push(PAGES.static.administrationOpco.getPath())} textStyle="xs">
                  Entreprises
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">{establishment_raison_sociale}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          )}
          {user && user.type !== AUTHTYPE.ENTREPRISE && user.type !== AUTHTYPE.OPCO && (
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => router.back()} textStyle="xs">
                  Administration des offres
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                {dataId ? <BreadcrumbLink textStyle="xs">{establishment_raison_sociale}</BreadcrumbLink> : <BreadcrumbLink textStyle="xs">Nouvelle entreprise</BreadcrumbLink>}
              </BreadcrumbItem>
            </Breadcrumb>
          )}
        </Breadcrumb>
      </Box>
      <Flex justify="space-between" align="center">
        <Text fontSize="2rem" fontWeight={700}>
          {establishment_raison_sociale ?? `SIRET ${establishment_siret}`}
        </Text>
        {ActionButtons}
      </Flex>
      <Text fontWeight="700" py={6}>
        Offres de recrutement en alternance
      </Text>
      <OffresTabs showStats={showStats} recruiter={data} buildOfferEditionUrl={getOffreEditionUrl} />
    </Container>
  )
}

const EmptySpace = () => (
  <Stack direction={["column", "column", "column", "row"]} mt={12} pt={12} py={8} border="1px solid" borderColor="grey.400" spacing="32px">
    <Flex justify={["center", "center", "center", "flex-end"]} align={["center", "center", "center", "flex-start"]} w={["100%", "100%", "100%", "350px"]} h="150px">
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src="/images/espace_pro/add-offer.svg" />
    </Flex>

    <Box w={["100%", "100%", "100%", "600px"]}>
      <Heading fontSize="2rem" pb={7}>
        Ajoutez votre première offre d’emploi en alternance.
      </Heading>
      <Text fontSize="1.375rem">
        Décrivez vos besoins de recrutement pour les afficher sur le site <span style={{ fontWeight: "700" }}>La bonne alternance</span> dès aujourd’hui.
      </Text>
    </Box>
  </Stack>
)
