"use client"

import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Center, Checkbox, Container, Divider, Flex, Heading, Link, Spinner, Square, Text } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { IEtablissementCatalogueProcheWithDistance } from "shared/interface/etablissement.types"

import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { Check } from "@/theme/components/icons"
import { createEtablissementDelegation, getEntrepriseInformation, getOffre, getRelatedEtablissementsFromRome } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

function Page() {
  const { job_id } = useParams() as { job_id: string }
  const { user } = useConnectedSessionClient()
  const router = useRouter()

  const [etablissements, setEtablissements] = useState([])

  const isSubmitButtonEnabled = (etablissements ?? []).find((item) => item.checked)

  const checkEtablissement = (etablissement) => {
    const etablissementUpdated = etablissements.map((item) => (etablissement._id === item._id ? { ...item, checked: !etablissement.checked } : item))
    setEtablissements(etablissementUpdated)
  }

  const { data: job } = useQuery({
    queryKey: ["getJob", job_id],
    queryFn: () => getOffre(job_id),
    enabled: Boolean(job_id),
  })

  const { data: entrepriseData } = useQuery({
    queryKey: ["getEntreprise", user.establishment_siret],
    queryFn: () => getEntrepriseInformation(user.establishment_siret, { skipUpdate: true }),
    enabled: Boolean(user.establishment_siret),
  })

  const geo_coordinates = entrepriseData?.error === false ? entrepriseData?.data?.geo_coordinates : undefined

  const codeRome = job?.rome_code?.[0]
  const [latitude, longitude] = geo_coordinates?.split(",") ?? []

  useQuery({
    queryKey: ["getRelatedEtablissementsFromRome", codeRome, latitude, longitude],
    enabled: Boolean(latitude && longitude && codeRome),
    queryFn: () =>
      getRelatedEtablissementsFromRome({ rome: codeRome, latitude: parseFloat(latitude), longitude: parseFloat(longitude), limit: 10 }).then(
        (data: IEtablissementCatalogueProcheWithDistance[]) => {
          const etablissementUpdated = data.map((data, index) => ({
            ...data,
            checked: index < 3,
          }))
          setEtablissements(etablissementUpdated)
          return data
        }
      ),
  })

  const goBack = () => router.push(PAGES.static.backHomeEntreprise.getPath())

  const submit = async () => {
    const etablissementCatalogueIds = etablissements.filter((etablissement) => etablissement.checked).map((etablissement) => etablissement._id)

    await createEtablissementDelegation({
      jobId: job._id,
      data: { etablissementCatalogueIds },
    }).then(goBack)
  }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backHomeEntreprise, PAGES.dynamic.backEntrepriseEditionOffre({ job_id }), PAGES.dynamic.backEntrepriseMiseEnRelation({ job_id })]} />
      <DepotSimplifieStyling>
        <Container maxW="container.xl">
          <Flex direction={["column", "column", "row", "row"]} gap={[4, 4, 4, 10]} mb={12} mt={4}>
            <Box>
              <Heading className="big">Ces centres de formation pourraient vous proposer des candidats</Heading>
              <Text py={4}>
                Les centres de formation suivants proposent des formations en lien avec votre offre et sont localisés à proximité de votre entreprise.
                <br />
                Choisissez ceux à qui vous souhaitez partager votre offre.
              </Text>
              {!etablissements?.length ? (
                <Flex justify="center" align="center" direction="column">
                  <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
                  <Text>Recherche en cours...</Text>
                </Flex>
              ) : (
                etablissements.map((etablissement, index) => {
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
                        <Text size="16px" lineHeight="25px" fontWeight="400" color="#161616" pr={3}>
                          {etablissement.entreprise_raison_sociale}
                        </Text>
                        <Text size="12px" lineHeight="25px" color="#666666" pr={3}>
                          {etablissement?.numero_voie} {etablissement?.type_voie} {etablissement?.nom_voie}, {etablissement?.code_postal} {etablissement?.nom_departement}
                        </Text>
                        <Link
                          href={`https://catalogue-apprentissage.intercariforef.org/etablissement/${etablissement.siret}`}
                          isExternal
                          aria-label="Etablissement sur le site du catalogue des formations en apprentissage - nouvelle fenêtre"
                        >
                          <Flex>
                            <Text lineHeight="25px">
                              <u>En savoir plus</u> <ExternalLinkIcon mx="2px" />
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
                })
              )}
              <Box
                sx={{
                  display: "flex",
                  gap: fr.spacing("2w"),
                  justifyContent: "flex-end",
                  marginTop: fr.spacing("8v"),
                }}
              >
                <Button priority="secondary" onClick={goBack} data-testid="pass-delegation">
                  Annuler
                </Button>
                <Button priority="primary" disabled={!isSubmitButtonEnabled} onClick={submit} data-testid="submit-delegation">
                  Envoyer ma demande
                </Button>
              </Box>
            </Box>
            <Box>
              <BorderedBox>
                <Heading mb={3}>Pourquoi être accompagné par des CFA dans votre recherche d’alternant ?</Heading>
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
              </BorderedBox>
            </Box>
          </Flex>
        </Container>
      </DepotSimplifieStyling>
    </>
  )
}

export default Page
