"use client"
import { Box, Center, Checkbox, Container, Divider, Flex, Heading, Link, Square, Text } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { ENTREPRISE } from "shared/constants/recruteur"
import { IEtablissementCatalogueProcheWithDistance } from "shared/interface/etablissement.types"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { createEtablissementDelegation, createEtablissementDelegationByToken, getFormulaire, getRelatedEtablissementsFromRome } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

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

function AucunCFAProche({ title }: { title?: string }) {
  return (
    <Flex>
      <Box minWidth={["100%", "100%", "50%"]}>
        <Box p={6}>
          <Image fetchPriority="high" src="/images/aucunCfa.svg" alt="" unoptimized width={287} height={169} style={{ width: "100%", maxWidth: "287px" }} />
          <Heading fontSize="24px" mt={5}>
            Aucun CFA à proximité
          </Heading>
          <Text mt={6}>
            Votre offre :{" "}
            <Text as="span" fontWeight={700}>
              {title}
            </Text>
          </Text>
          <Text mt={4}>Nous n’avons pas identifié de centre de formation dans un rayon de 100km autour de votre entreprise qui forme sur le métier pour lequel vous recrutez.</Text>
        </Box>
      </Box>
      <InfoDelegation />
    </Flex>
  )
}

function DelegationsEnregistrees({
  first_name,
  last_name,
  email,
  phone,
  router,
}: {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  router: any
}) {
  return (
    <Box ml={10} display={{ base: "none", lg: "block" }}>
      <Box border="1px solid #000091" p={6} mb={5}>
        <Flex>
          <Image fetchPriority="high" src="/images/espace_pro/miseEnRelationEnvoyee.svg" alt="" unoptimized width={268} height={150} style={{ width: "100%", maxWidth: "268px" }} />
          <Box>
            <Heading fontSize="24px" mb={3} ml={5}>
              Votre offre a été partagée aux CFA sélectionnés
            </Heading>
            <Box ml={5}>
              Les écoles que vous avez sélectionnées ont reçu par email votre offre et vos coordonnées suivantes :
              <Text mt={2}>
                Prénom:{" "}
                <Text as="span" fontWeight={700}>
                  {first_name}
                </Text>
              </Text>
              <Text mt={2}>
                Nom:{" "}
                <Text as="span" fontWeight={700}>
                  {last_name}
                </Text>
              </Text>
              <Text mt={2}>
                Email:{" "}
                <Text as="span" fontWeight={700}>
                  {email}
                </Text>
              </Text>
              <Text mt={2}>
                Numéro de téléphone:{" "}
                <Text as="span" fontWeight={700}>
                  {phone}
                </Text>
              </Text>
              <Text mt={4}>Elles peuvent désormais vous recontacter pour vous proposer des candidats en adéquation avec vos besoins.</Text>
            </Box>
          </Box>
        </Flex>
      </Box>
      <Button
        onClick={() => {
          router.push(PAGES.dynamic.backHome({ userType: ENTREPRISE }).getPath())
        }}
      >
        Retourner aux offres
      </Button>
    </Box>
  )
}

export default function MiseEnRelation({ establishment_id }: { establishment_id: string }) {
  const router = useRouter()
  const { job_id, token } = useParams() as { job_id: string; token?: string }

  const [checkedDisabledEtablissements, setCheckedDisabledEtablissements] = useState<IEtablissementCatalogueProcheWithDistance[]>([])

  const { data: formulaire, isLoading: isFormulaireLoading } = useQuery({
    queryKey: ["formulaire"],
    enabled: !!establishment_id,
    queryFn: () => getFormulaire(establishment_id),
  })

  const offre = formulaire ? formulaire.jobs.find((offre) => offre._id === job_id) : null

  const { data: etablissements, isLoading: isEtablissementLoading } = useQuery({
    queryKey: ["etablissements"],
    queryFn: async () => {
      const etablissements = await getRelatedEtablissementsFromRome({
        rome: offre.rome_code[0],
        latitude: formulaire.geopoint.coordinates[1],
        longitude: formulaire.geopoint.coordinates[0],
        limit: 10,
      })
      setCheckedDisabledEtablissements(
        etablissements.filter((etablissement: IEtablissementCatalogueProcheWithDistance) => offre.delegations?.some((delegation) => etablissement.siret === delegation.siret_code))
      )
      return etablissements
    },

    enabled: !!formulaire?._id && !!offre?._id,
    gcTime: 0,
  })

  const [checkedEtablissements, setCheckedEtablissements] = useState<IEtablissementCatalogueProcheWithDistance[]>(
    etablissements ? etablissements.filter((etablissement) => etablissement.checked) : []
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [delegationsEnregistrees, setDelegationsEnregistrees] = useState(false)

  /**
   * @description Handles all checkboxes.
   * @param {Object} etablissement
   * @return {void}
   */
  const changeEtablissement = (etablissement) => {
    const index = checkedEtablissements.findIndex((item) => item._id === etablissement._id)
    if (index === -1) {
      setCheckedEtablissements([...checkedEtablissements, etablissement])
    } else {
      setCheckedEtablissements(checkedEtablissements.filter((_, i) => i !== index))
    }
  }

  const submit = async () => {
    setIsSubmitting(true)
    const etablissementCatalogueIds = checkedEtablissements.map((etablissement) => etablissement._id)

    await (
      token
        ? createEtablissementDelegationByToken({
            jobId: offre._id,
            data: { etablissementCatalogueIds },
            token: token as string,
          })
        : createEtablissementDelegation({
            jobId: offre._id,
            data: { etablissementCatalogueIds },
          })
    )
      .then(() => {
        setDelegationsEnregistrees(true)
        window.scrollTo(0, 0)
      })
      .finally(() => setIsSubmitting(false))
  }

  if (isFormulaireLoading || isEtablissementLoading) return <LoadingEmptySpace label="Chargement en cours" />

  return (
    <DepotSimplifieStyling>
      <Container maxW="container.xl">
        <Breadcrumb pages={[PAGES.static.backHomeEntreprise, PAGES.dynamic.backEntrepriseMiseEnRelation({ job_id })]} />
        {delegationsEnregistrees ? (
          <DelegationsEnregistrees router={router} first_name={formulaire.first_name} last_name={formulaire.last_name} email={formulaire.email} phone={formulaire.phone} />
        ) : (
          <>
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
                        const isDisabled = checkedDisabledEtablissements.some((etab) => etab._id === etablissement._id)
                        return (
                          <Flex
                            borderStyle="solid"
                            borderWidth="1px"
                            borderColor={isDisabled ? "#E5E5E5" : "#000091"}
                            py={4}
                            key={etablissement._id}
                            mb={4}
                            data-testid={`cfa-${index}`}
                          >
                            <Center w="70px">
                              <Checkbox disabled={isDisabled} defaultChecked={etablissement.checked || isDisabled} onChange={() => changeEtablissement(etablissement)} />
                            </Center>
                            <Box flex="1">
                              {isDisabled && (
                                <Flex backgroundColor="#F6F6F6">
                                  <Image fetchPriority="high" src="/images/icons/chrono.svg" alt="" unoptimized width={16} height={16} />
                                  <Text ml={2} fontSize="12px" color="#666666" mb={2}>
                                    CFA déjà contacté
                                  </Text>
                                </Flex>
                              )}
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
                  </Box>
                  <InfoDelegation />
                </Flex>
                <Box
                  width="100%"
                  my={1}
                  position={"sticky"}
                  bottom={0}
                  left={0}
                  bgColor="white"
                  zIndex={1}
                  p={5}
                  style={{
                    boxShadow: "0px -16px 16px -16px rgba(0, 0, 0, 0.32)",
                  }}
                >
                  <Button disabled={checkedEtablissements.length === 0 || isSubmitting} onClick={submit} data-testid="submit-delegation">
                    Envoyer ma demande
                  </Button>
                </Box>
              </Box>
            )}
            {etablissements?.length === 0 && <AucunCFAProche title={offre.rome_appellation_label} />}
          </>
        )}
        {/*
        reste à faire :
        template Email
        redirection email (conf next properties)
        automate envoi d'emails
        lien avec token
        connexion par token
        */}
      </Container>
    </DepotSimplifieStyling>
  )
}
