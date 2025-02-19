import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Link as ChakraLink, Container, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react"
import NavLink from "next/link"
import { useRouter } from "next/router"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { SiretAutocomplete } from "@/components/espace_pro/Authentification/SiretAutocomplete"
import { useAuth } from "@/context/UserContext"

import { AnimationContainer, Layout } from "../../../../components/espace_pro"
import { authProvider, withAuth } from "../../../../components/espace_pro/withAuth"
import { InfoCircle } from "../../../../theme/components/icons"
import { getEntrepriseInformation, getEntrepriseOpco } from "../../../../utils/api"

const CreationCompte = () => {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <SiretAutocomplete
      onSubmit={({ establishment_siret }, { setSubmitting, setFieldError }) => {
        const formattedSiret = establishment_siret.replace(/[^0-9]/g, "")
        Promise.all([getEntrepriseOpco(formattedSiret), getEntrepriseInformation(formattedSiret, { cfa_delegated_siret: user.cfa_delegated_siret })]).then(
          ([opcoInfos, entrepriseData]) => {
            if (entrepriseData.error === true) {
              if (entrepriseData.statusCode >= 500) {
                router.push({
                  pathname: "/espace-pro/administration/entreprise/detail",
                  query: { informationSiret: JSON.stringify({ establishment_siret: formattedSiret, ...opcoInfos }) },
                })
              } else {
                setFieldError(
                  "establishment_siret",
                  entrepriseData?.data?.errorCode === BusinessErrorCodes.NON_DIFFUSIBLE ? BusinessErrorCodes.NON_DIFFUSIBLE : entrepriseData.message
                )
                setSubmitting(false)
              }
            } else if (entrepriseData.error === false) {
              setSubmitting(true)
              router.push({
                pathname: "/espace-pro/administration/entreprise/detail",
                query: { informationSiret: JSON.stringify({ establishment_siret: formattedSiret, ...opcoInfos }) },
              })
            }
          }
        )
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
    <Layout footer={false}>
      <AnimationContainer>
        <Container maxW="container.xl" mt={5}>
          <Box mb={5}>
            <Breadcrumb spacing="4px" textStyle="xs">
              <BreadcrumbItem isCurrentPage>
                <NavLink legacyBehavior href="/espace-pro/administration" passHref>
                  <BreadcrumbLink textStyle="xs"> Administration des offres</BreadcrumbLink>
                </NavLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </Box>
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
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(CreationEntreprise))
