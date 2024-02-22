import { Box, Button, Center, Checkbox, Container, Divider, Flex, Grid, GridItem, Heading, Link, Spinner, Square, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { ArrowRightLine, Check } from "../../../theme/components/icons"
import { createEtablissementDelegation, createEtablissementDelegationByToken, getRelatedEtablissementsFromRome } from "../../../utils/api"

/**
 * @description "Mise en relation" page.
 * @return {JSX.Element}
 */
function CreationMiseEnRelationPage({ isWidget }: { isWidget?: boolean }) {
  const router = useRouter()

  const [etablissements, setEtablissements] = useState(null)
  const [isSubmitButtonEnabled, setIsSubmitButtonEnabled] = useState(false)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  const { job: jobString, email, geo_coordinates, fromDashboard, userId, establishment_id, token } = router.query
  const job = JSON.parse((jobString as string) ?? "{}")

  /**
   * @description Handles all checkboxes.
   * @param {Object} etablissement
   * @return {void}
   */
  const checkEtablissement = (etablissement) => {
    const etablissementUpdated = etablissements.map((item) => (etablissement._id === item._id ? { ...item, checked: !etablissement.checked } : item))

    setIsSubmitButtonEnabled(!!etablissementUpdated.find((item) => item.checked))
    setEtablissements(etablissementUpdated)
  }

  const goToEndStep = ({ withDelegation }) => {
    router.replace({
      pathname: isWidget ? "/espace-pro/widget/entreprise/fin" : "/espace-pro/creation/fin",
      query: { job: JSON.stringify(job), email, withDelegation, fromDashboard, userId, establishment_id, token },
    })
  }

  /**
   * Skip delegation stage.
   */
  const skip = () => {
    goToEndStep({ withDelegation: false })
  }

  /**
   * @description Handles submit button.
   * @return {Promise<void>}
   */
  const submit = async () => {
    setIsSubmitLoading(true)
    const etablissementCatalogueIds = etablissements.filter((etablissement) => etablissement.checked).map((etablissement) => etablissement._id)

    await (token
      ? createEtablissementDelegationByToken({
          jobId: job._id,
          data: { etablissementCatalogueIds },
          token: token as string,
        })
      : createEtablissementDelegation({
          jobId: job._id,
          data: { etablissementCatalogueIds },
        })
    ).finally(() => setIsSubmitLoading(false))

    goToEndStep({ withDelegation: true })
  }

  /**
   * @description On mount, gets all related "etablissements".
   * @returns {void}
   */
  useEffect(() => {
    if (geo_coordinates) {
      const [latitude, longitude] = (geo_coordinates as string).split(",")

      getRelatedEtablissementsFromRome({ rome: job?.rome_detail?.code || job?.rome_code[0], latitude: parseFloat(latitude), longitude: parseFloat(longitude) }).then(({ data }) => {
        const etablissementUpdated = data.slice(0, 10).map((data, index) => ({
          ...data,
          checked: index < 3,
        }))
        setEtablissements(etablissementUpdated)
        setIsSubmitButtonEnabled(!!etablissementUpdated.find((item) => item.checked === true))
      })
    }
  }, [])

  if (!job && !email && !geo_coordinates && !fromDashboard && !userId) return <></>

  return (
    <>
      <Container maxW="container.xl">
        <Box p={5} mb={10}>
          <Grid templateRows={["1fr", ".4fr 2fr"]} templateColumns={["1fr", "4fr 5fr"]} gap={4}>
            <GridItem mb={0}>
              <Heading fontSize="32px">Ces centres de formation pourraient vous proposer des candidats</Heading>
              <Text fontSize="20px" pt="32px">
                Les centres de formation suivants proposent des formations en lien avec votre offre et sont localisés à proximité de votre entreprise.
                <br />
                Choisissez ceux que vous souhaitez solliciter.
              </Text>
            </GridItem>
            {etablissements && (
              <GridItem rowStart={["auto", 2]}>
                {etablissements.map((etablissement, index) => {
                  return (
                    <Flex borderStyle="solid" borderWidth="1px" borderColor="#000091" py={4} key={etablissement._id} mb={4} data-testid={`cfa-${index}`}>
                      <Center w="70px">
                        <Checkbox
                          defaultChecked={etablissement.checked}
                          icon={etablissement.checked ? <Check w="20px" h="18px" /> : <></>}
                          onChange={() => checkEtablissement(etablissement)}
                        />
                      </Center>
                      <Box flex="1">
                        <Text size="16px" lineHeight="25px" fontWeight="400" color="#161616" textTransform="capitalize" pr={3}>
                          {etablissement.entreprise_raison_sociale}
                        </Text>
                        <Text size="12px" lineHeight="25px" color="#666666" textTransform="capitalize" pr={3}>
                          {etablissement?.numero_voie} {etablissement?.type_voie} {etablissement?.nom_voie}, {etablissement?.code_postal} {etablissement?.nom_departement}
                        </Text>
                        <Link href={`https://catalogue.apprentissage.beta.gouv.fr/etablissement/${etablissement._id}`} isExternal>
                          <Flex>
                            <Text lineHeight="25px">
                              <u>En savoir plus</u>
                            </Text>
                          </Flex>
                        </Link>
                      </Box>
                      <Square>
                        <Center height="90px">
                          <Divider orientation="vertical" />
                        </Center>
                        <Text size="12px" fontWeight="700" color="#666666" px={4}>
                          à {etablissement.distance_en_km} km
                        </Text>
                      </Square>
                    </Flex>
                  )
                })}
              </GridItem>
            )}
            <GridItem rowStart={["auto", 2]} ml={{ lg: 10 }} mt={{ lg: "-290px" }}>
              {!etablissements ? (
                <Flex h="100%" justify="center" align="center" direction="column">
                  <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
                  <Text>Recherche en cours...</Text>
                </Flex>
              ) : (
                <Box border="1px solid #000091" p={6}>
                  <Heading fontSize="24px" mb={3} ml={5}>
                    Pourquoi être accompagné par des CFA dans votre recherche d’alternant ?
                  </Heading>
                  <Box ml={5}>
                    <Text fontWeight="700" mt={6}>
                      Gagnez du temps.
                    </Text>
                    <Text mt={4}>Accélérez votre recrutement, et trouvez des candidats qualifiés en partageant votre offre aux acteurs de l’apprentissage de votre région.</Text>
                    <Text fontWeight="700" mt={6}>
                      Rejoignez le réseau des acteurs de l'apprentissage de votre territoire.
                    </Text>
                    <Text mt={4}>
                      Développez des relations de confiance avec les acteurs de l'apprentissage de votre territoire afin de promouvoir votre entreprise et vos métiers auprès des
                      jeunes.
                    </Text>
                  </Box>
                </Box>
              )}
            </GridItem>
          </Grid>
        </Box>
      </Container>
      <Box backgroundColor="#FFFFFF" sx={{ position: "sticky", bottom: "0" }} boxShadow={"0px -16px 16px -16px rgba(0, 0, 0, 0.32), 0px -8px 16px rgba(0, 0, 0, 0.1);"} w="full">
        <Container maxW="container.xl">
          <Box p={5}>
            <Grid gap={4}>
              <GridItem mb={0}>
                <Button variant="secondary" onClick={skip} mr={4} my={2} data-testid="pass-delegation">
                  Passer cette étape
                </Button>
                <Button
                  leftIcon={<ArrowRightLine />}
                  variant="form"
                  isActive={isSubmitButtonEnabled}
                  isDisabled={!isSubmitButtonEnabled}
                  isLoading={isSubmitLoading}
                  onClick={submit}
                  my={1}
                  data-testid="submit-delegation"
                >
                  Envoyer ma demande
                </Button>
              </GridItem>
            </Grid>
          </Box>
        </Container>
      </Box>
    </>
  )
}

export default CreationMiseEnRelationPage
