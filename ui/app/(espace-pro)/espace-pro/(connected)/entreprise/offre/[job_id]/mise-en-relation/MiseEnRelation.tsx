"use client"
import { Box, Button, Center, Checkbox, Container, Divider, Flex, Heading, Link, Square, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useState } from "react"
import { IEtablissementCatalogueProcheWithDistance } from "shared/interface/etablissement.types"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { getFormulaire, getOffre, getRelatedEtablissementsFromRome } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

// export const getRelatedEtablissementsFromRome = async ({ rome, latitude, longitude, limit }: { rome: string; latitude: number; longitude: number; limit: number }) =>
//   apiGet(`/etablissement/cfas-proches`, { querystring: { rome, latitude, longitude, limit } })

// export const createEtablissementDelegation = ({ data, jobId }: { jobId: string; data: INewDelegations }) =>
//   apiPost(`/formulaire/offre/:jobId/delegation`, { params: { jobId }, body: data })
// export const createEtablissementDelegationByToken = ({ data, jobId, token }: { jobId: string; data: INewDelegations; token: string }) =>
//   apiPost(`/formulaire/offre/:jobId/delegation/by-token`, { params: { jobId }, body: data, headers: { authorization: `Bearer ${token}` } })

function InfoDelegation() {
  return (
    <Box ml={10} display={{ base: "none", lg: "block" }}>
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
            Développez des relations de confiance avec les acteurs de l'apprentissage de votre territoire afin de promouvoir votre entreprise et vos métiers auprès des jeunes.
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
/**
 * @description "Mise en relation" page.
 * @return {JSX.Element}
 */
export default function MiseEnRelation({ establishment_id }: { establishment_id: string }) {
  //const router = useRouter()

  const { data: formulaire, isLoading: isFormulaireLoading } = useQuery({
    queryKey: ["formulaire"],
    enabled: !!establishment_id,
    queryFn: () => getFormulaire(establishment_id),
  })

  const [isSubmitLoading /*, setIsSubmitLoading*/] = useState(false)

  const { job_id } = useParams() as { job_id: string }

  const { data: offre, isLoading } = useQuery({
    queryKey: ["offre"],
    queryFn: () => getOffre(job_id),
    enabled: Boolean(job_id),
    gcTime: 0,
  })

  const { data: etablissements, isLoading: isEtablissementLoading } = useQuery({
    queryKey: ["etablissements"],
    queryFn: () =>
      getRelatedEtablissementsFromRome({ rome: offre.rome_code[0], latitude: formulaire.geopoint.coordinates[1], longitude: formulaire.geopoint.coordinates[0], limit: 10 }),
    enabled: Boolean(formulaire),
    gcTime: 0,
  })

  const isSubmitButtonEnabled = (etablissements ?? []).find((item) => item.checked)

  /**
   * @description Handles all checkboxes.
   * @param {Object} etablissement
   * @return {void}
   */
  const checkEtablissement = (etablissement) => {
    const etablissementUpdated = etablissements.map((item) => (etablissement._id === item._id ? { ...item, checked: !etablissement.checked } : item))
    console.log(etablissementUpdated)
    //setEtablissements(etablissementUpdated)
  }

  //   const goToEndStep = ({ withDelegation }) => {
  //     router.replace({
  //       pathname: isWidget ? "/espace-pro/widget/entreprise/fin" : "/espace-pro/creation/fin",
  //       query: { jobId: job._id.toString(), email, withDelegation, fromDashboard, userId, establishment_id, token },
  //     })
  //   }

  const submit = async () => {}
  //   const submit = async () => {
  //     setIsSubmitLoading(true)
  //     const etablissementCatalogueIds = etablissements.filter((etablissement) => etablissement.checked).map((etablissement) => etablissement._id)

  //     await (
  //       token
  //         ? createEtablissementDelegationByToken({
  //             jobId: job._id,
  //             data: { etablissementCatalogueIds },
  //             token: token as string,
  //           })
  //         : createEtablissementDelegation({
  //             jobId: job._id,
  //             data: { etablissementCatalogueIds },
  //           })
  //     ).finally(() => setIsSubmitLoading(false))

  //     goToEndStep({ withDelegation: true })
  //   }

  /**
   * @description On mount, gets all related "etablissements".
   * @returns {void}
   */
  //   useEffect(() => {
  //     if (geo_coordinates) {
  //       const [latitude, longitude] = (geo_coordinates as string).split(",")

  //       getRelatedEtablissementsFromRome({ rome: job?.rome_detail?.code || job?.rome_code[0], latitude: parseFloat(latitude), longitude: parseFloat(longitude), limit: 10 }).then(
  //         (data: IEtablissementCatalogueProcheWithDistance[]) => {
  //           const etablissementUpdated = data.map((data, index) => ({
  //             ...data,
  //             checked: index < 3,
  //           }))
  //           setEtablissements(etablissementUpdated)
  //         }
  //       )
  //     }
  //   }, [geo_coordinates])

  if (isFormulaireLoading || isLoading || isEtablissementLoading) return <LoadingEmptySpace label="Chargement en cours" />

  console.log("etablissements", etablissements)

  return (
    <DepotSimplifieStyling>
      <Container maxW="container.xl">
        <Breadcrumb pages={[PAGES.static.backHomeEntreprise, PAGES.dynamic.backEntrepriseMiseEnRelation({ job_id })]} />
        {etablissements?.length > 0 && (
          <Box p={5}>
            <Flex>
              <Box minWidth={["100%", "100%", "50%"]}>
                <Heading fontSize="32px">Ces centres de formation pourraient vous proposer des candidats</Heading>
                <Text fontSize="20px">
                  Les centres de formation suivants proposent des formations en lien avec votre offre et sont localisés à proximité de votre entreprise.
                  <br />
                  Choisissez ceux à qui vous souhaitez partager votre offre.
                </Text>

                <Box mt={5}>
                  {etablissements.map((etablissement: IEtablissementCatalogueProcheWithDistance, index) => {
                    return (
                      <Flex borderStyle="solid" borderWidth="1px" borderColor="#000091" py={4} key={etablissement._id} mb={4} data-testid={`cfa-${index}`}>
                        <Center w="70px">
                          <Checkbox defaultChecked={etablissement.checked} onChange={() => checkEtablissement(etablissement)} />
                        </Center>
                        <Box flex="1">
                          <Text size="16px" lineHeight="25px" fontWeight="400" color="#161616" textTransform="capitalize" pr={3}>
                            {etablissement.entreprise_raison_sociale}
                          </Text>
                          <Text size="12px" lineHeight="25px" color="#666666" textTransform="capitalize" pr={3}>
                            {etablissement?.numero_voie} {etablissement?.type_voie} {etablissement?.nom_voie}, {etablissement?.code_postal} {etablissement?.nom_departement}
                          </Text>
                          <Link
                            href={`https://catalogue-apprentissage.intercariforef.org/etablissement/${etablissement.siret}`}
                            isExternal
                            aria-label="Etablissement sur le site du catalogue des formations en apprentissage - nouvelle fenêtre"
                          >
                            En savoir plus
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
                </Box>
                <Button
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
              </Box>
              <InfoDelegation />
            </Flex>
          </Box>
        )}
        {etablissements?.length === 0 && <Box>RIEN</Box>}

        {/*
        page pas de cfas proche
        style des éléments
        submit du résultat
        affichage du résultat

        template Email
        automate envoi d'emails
        lien avec token
        connexion par token
*/}
      </Container>
    </DepotSimplifieStyling>
  )
}
