import { Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text, useToast } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { IJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { getDirectJobPath } from "shared/metier/lbaitemutils"

import { LoadingEmptySpace } from "../.."
import { dayjs } from "../../../../common/dayjs"
import { publicConfig } from "../../../../config.public"
import { Copy } from "../../../../theme/components/icons"
import { getDelegationDetails, viewOffreDelegation } from "../../../../utils/api"
import { RomeDetailReadOnly } from "../../../DepotOffre/RomeDetailReadOnly"

export function PropositionOffreId({ idFormulaire, jobId, siretFormateur, token }: { idFormulaire: string; jobId: string; siretFormateur: string; token: string }) {
  const toast = useToast()

  const formulaireQuery = useQuery(["getFormulaire", idFormulaire, token], () => getDelegationDetails(idFormulaire, token), {
    enabled: Boolean(idFormulaire && token),
  })

  useQuery(["viewDelegation", jobId, siretFormateur, token], () => viewOffreDelegation(jobId, siretFormateur, token), {
    enabled: Boolean(jobId && siretFormateur && token),
  })

  const formulaire = formulaireQuery?.data
  const job = (formulaire?.jobs as IJobJson[])?.find((job) => job._id === jobId)

  /**
   * @description Copy in clipboard.
   * @return {Promise<void>}
   */
  const copyInClipboard = () => {
    navigator.clipboard.writeText(`${publicConfig.baseUrl}${getDirectJobPath(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job._id)}`)
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
    <Container maxW="container.xl" mb={20}>
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
        <Button mt={5} type="submit" variant="primary" leftIcon={<Copy width={5} />} onClick={copyInClipboard}>
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
    </Container>
  )
}
