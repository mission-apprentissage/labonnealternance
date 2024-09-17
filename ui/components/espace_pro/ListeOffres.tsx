import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Container, Flex, Heading, Image, Stack, Text } from "@chakra-ui/react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useRouter } from "next/router"
import { useQuery } from "react-query"
import { IJob } from "shared"

import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../common/contants"
import { ArrowDropRightLine, Building, Plus } from "../../theme/components/icons"
import { getFormulaire } from "../../utils/api"

import { OffresTabs } from "./OffresTabs"

import { LoadingEmptySpace } from "."

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

export default function ListeOffres({ hideModify = false, showStats = false }: { hideModify?: boolean; showStats?: boolean }) {
  const router = useRouter()
  const { user } = useAuth()

  dayjs.extend(relativeTime)

  const { establishment_id } = router.query as { establishment_id: string }
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
  const jobs: (IJob & { candidatures: number })[] = data.jobs ?? []

  const entrepriseTitle = establishment_raison_sociale ?? establishment_siret
  const getOffreCreationUrl = () => {
    switch (user.type) {
      case AUTHTYPE.OPCO:
        return `/espace-pro/administration/opco/entreprise/${establishment_siret}/${establishment_id}/offre/creation`
      default:
        return `/espace-pro/administration/entreprise/${establishment_id}/offre/creation`
    }
  }
  const navigateToCreation = () => {
    // navigate(getOffreCreationUrl(), {
    //   state: { raison_sociale: entrepriseTitle },
    // })
    router.push({
      pathname: getOffreCreationUrl(),
      query: { raison_sociale: entrepriseTitle },
    })
  }

  if (jobs.length === 0) {
    return (
      <Container maxW="container.xl" my={12}>
        <Flex justify="space-between" align="center">
          <Text fontSize="2rem" fontWeight={700}>
            {entrepriseTitle}
          </Text>
          <Box>
            {!hideModify && user.type !== AUTHTYPE.OPCO && (
              <Button mr={5} variant="secondary" leftIcon={<Building />} onClick={() => router.push(`/espace-pro/administration/entreprise/${establishment_id}/edition`)}>
                Modifier l'entreprise
              </Button>
            )}
            <Button variant="primary" leftIcon={<Plus />} onClick={navigateToCreation}>
              Ajouter une offre
            </Button>
          </Box>
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
                <BreadcrumbLink textDecoration="underline" onClick={() => router.push("/espace-pro/administration/opco")} textStyle="xs">
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
        <Box>
          {!hideModify && user.type !== AUTHTYPE.OPCO && (
            <Button mr={5} variant="secondary" leftIcon={<Building />} onClick={() => router.push(`/espace-pro/administration/entreprise/${establishment_id}/edition`)}>
              {user.type === AUTHTYPE.ENTREPRISE ? "Mes informations" : "Modifier l'entreprise"}
            </Button>
          )}
          <Button variant="primary" leftIcon={<Plus />} onClick={navigateToCreation}>
            Ajouter une offre
          </Button>
        </Box>
      </Flex>
      <Text fontWeight="700" py={6}>
        Offres de recrutement en alternance
      </Text>
      <OffresTabs showStats={showStats} establishmentId={establishment_id} recruiter={data} />
    </Container>
  )
}
