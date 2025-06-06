"use client"

import { Box, Flex, Heading, SimpleGrid, Stack, Text, useToast } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { useQuery } from "@tanstack/react-query"
import { IJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { dayjs } from "@/common/dayjs"
import { RomeDetailReadOnly } from "@/components/DepotOffre/RomeDetailReadOnly"
import { LoadingEmptySpace } from "@/components/espace_pro"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { publicConfig } from "@/config.public"
import { getDelegationDetails, viewOffreDelegation } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export function PropositionOffreId({ idFormulaire, jobId, siretFormateur, token }: { idFormulaire: string; jobId: string; siretFormateur: string; token: string }) {
  const toast = useToast()

  const { isError, data: formulaire } = useQuery({
    queryKey: ["getFormulaire", idFormulaire, token],
    queryFn: () => getDelegationDetails(idFormulaire, token),
    enabled: Boolean(idFormulaire && token),
  })

  useQuery({
    queryKey: ["viewDelegation", jobId, siretFormateur, token],
    queryFn: () => viewOffreDelegation(jobId, siretFormateur, token),
    enabled: Boolean(jobId && siretFormateur && token),
  })

  if (isError) {
    throw new Error("Une erreur est survenue lors de la récupération des informations de l'entreprise.")
  }

  const job = (formulaire?.jobs as IJobJson[])?.find((job) => job._id === jobId)

  /**
   * @description Copy in clipboard.
   * @return {Promise<void>}
   */
  const copyInClipboard = () => {
    const jobUrl = PAGES.dynamic.jobDetail({ type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, jobId: job._id }).getPath()
    navigator.clipboard.writeText(`${publicConfig.baseUrl}${jobUrl}`)
    toast({
      title: "Lien copié.",
      position: "top-right",
      status: "success",
      duration: 5000,
    })
  }

  if (!job) {
    return <LoadingEmptySpace />
  }

  const competencesRome = job.competences_rome ?? job?.rome_detail?.competences

  return (
    <DepotSimplifieStyling>
      <Box>
        <Heading fontSize="32px" mt={8} mb={6}>
          Détails de la demande
        </Heading>
        <hr />
      </Box>
      <Box mt={10} p={6} bg={"bluefrance.100"}>
        <Heading fontSize="20px">Souhaitez-vous proposer des candidats à cette entreprise ?</Heading>
        <Text fontSize="16px" mt={5}>
          Vous pouvez contacter directement l’entreprise pour évaluer son besoin, ou alors partager le lien vers l’offre à vos étudiants :
        </Text>
        <Button
          style={{
            marginTop: fr.spacing("4v"),
          }}
          type="submit"
          priority="primary"
          onClick={copyInClipboard}
        >
          Copier l'url
        </Button>
      </Box>
      <SimpleGrid columns={2} spacing={10} mt={10} mb={10}>
        <Box>
          <Heading fontSize="24px" mb={10}>
            Offre d’alternance
          </Heading>
          <Stack direction="column" spacing={7}>
            <Flex align="center">
              <Text mr={3}>Métier :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1} maxW="80%">
                {job.rome_label}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Type de contrat :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {job.job_type.join(",")}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Niveau de formation : </Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {job.job_level_label}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Date de début :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {dayjs(job.job_start_date).format("DD/MM/YYYY")}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Durée du contrat :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {`${job.job_duration} mois`}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Nombre de postes :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {job.job_count}
              </Text>
            </Flex>
          </Stack>
        </Box>
        <Box border="solid 1px #000091" p={10}>
          <Heading fontSize="24px" mb={10}>
            Informations de contact
          </Heading>
          <Stack direction="column" spacing={7}>
            <Flex align="center">
              <Text mr={3}>Email :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.email}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Téléphone :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.phone}
              </Text>
            </Flex>
            <hr />
            <Heading fontSize="24px" mb={10}>
              Informations légales
            </Heading>
            <Flex align="center">
              <Text mr={3}>SIRET :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.establishment_siret}
              </Text>
            </Flex>
            {formulaire.establishment_enseigne && (
              <Flex align="center">
                <Text mr={3}>Enseigne :</Text>
                <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                  {formulaire.establishment_enseigne}
                </Text>
              </Flex>
            )}
            <Flex align="center">
              <Text mr={3}>Raison sociale :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.establishment_raison_sociale}
              </Text>
            </Flex>
            <Flex align="center">
              <Text mr={3}>Adresse :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {formulaire.address}
              </Text>
            </Flex>
          </Stack>
        </Box>
      </SimpleGrid>
      {competencesRome && <RomeDetailReadOnly romeReferentiel={job.rome_detail} competences={competencesRome} appellation={job.rome_appellation_label} />}
    </DepotSimplifieStyling>
  )
}
