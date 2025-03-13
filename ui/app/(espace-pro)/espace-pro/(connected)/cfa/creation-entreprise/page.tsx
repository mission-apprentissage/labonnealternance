"use client"

import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Link as ChakraLink, Container, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { AnimationContainer } from "@/components/espace_pro"
import { SiretAutocomplete } from "@/components/espace_pro/Authentification/SiretAutocomplete"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { useAuth } from "@/context/UserContext"
import { InfoCircle } from "@/theme/components/icons"
import { getEntrepriseInformation } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const CreationCompte = () => {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <SiretAutocomplete
      onSubmit={({ establishment_siret }, { setSubmitting, setFieldError }) => {
        const formattedSiret = establishment_siret.replace(/[^0-9]/g, "")
        getEntrepriseInformation(formattedSiret, { cfa_delegated_siret: user.cfa_delegated_siret }).then((entrepriseData) => {
          if (entrepriseData.error === true) {
            if (entrepriseData.statusCode >= 500) {
              router.push(PAGES.dynamic.backCfaEntrepriseCreationDetail(formattedSiret).getPath())
            } else {
              setFieldError(
                "establishment_siret",
                entrepriseData?.data?.errorCode === BusinessErrorCodes.NON_DIFFUSIBLE ? BusinessErrorCodes.NON_DIFFUSIBLE : entrepriseData.message
              )
              setSubmitting(false)
            }
          } else if (entrepriseData.error === false) {
            setSubmitting(true)
            router.push(PAGES.dynamic.backCfaEntrepriseCreationDetail(formattedSiret).getPath())
          }
        })
      }}
    />
  )
}

const InformationSiret = () => (
  <Box border="1px solid #000091" p={["4", "8"]}>
    <Heading fontSize="24px" mb={3}>
      Où trouver votre SIRET ?
    </Heading>
    <Flex alignItems="flex-start">
      <InfoCircle mr={2} mt={1} />
      <Text textAlign="justify">
        Le numéro d’identification de votre entreprise partenaire peut être trouvé sur
        <ChakraLink href="https://annuaire-entreprises.data.gouv.fr/" variant="classic" isExternal aria-label="Site de l'annuaire des entreprises - nouvelle fenêtre">
          l’annuaire des entreprises <ExternalLinkIcon mx="2px" />
        </ChakraLink>
        .
      </Text>
    </Flex>
  </Box>
)

function CreationEntreprise() {
  return (
    <DepotSimplifieStyling>
      <AnimationContainer>
        <Container maxW="container.xl" mt={5}>
          <Breadcrumb pages={[PAGES.static.backCfaHome, PAGES.static.backCfaCreationEntreprise]} />
          <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 10]}>
            <Box>
              <Heading>Renseignements entreprise</Heading>
              <Text fontSize="20px" textAlign="justify" mt={2}>
                Précisez le nom ou le SIRET de l’entreprise partenaire pour laquelle vous souhaitez diffuser des offres.
              </Text>
              <Box mt={4}>
                <CreationCompte />
              </Box>
            </Box>
            <Box>
              <InformationSiret />
            </Box>
          </SimpleGrid>
        </Container>
      </AnimationContainer>
    </DepotSimplifieStyling>
  )
}

export default CreationEntreprise
