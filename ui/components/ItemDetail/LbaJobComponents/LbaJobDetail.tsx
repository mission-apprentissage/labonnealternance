import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Accordion, Box, Flex, Image, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react"
import React, { useEffect } from "react"
import { ILbaItemLbaJob } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { notifyLbaJobDetailView } from "../../../services/notifyLbaJobDetailView"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { formatDate } from "../../../utils/strutils"
import { getCompanySize } from "../ItemDetailServices/getCompanySize"
import ItemDistanceToCenter from "../ItemDetailServices/ItemDistanceToCenter"
import ItemGoogleSearchLink from "../ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "../ItemDetailServices/ItemLocalisation"
import { ReportJobLink } from "../ReportJobLink"

import LbaJobAcces from "./LbaJobAcces"
import LbaJobCompetences from "./LbaJobCompetences"
import LbaJobDescription from "./LbaJobDescription"
import LbaJobQualites from "./LbaJobQualites"
import LbaJobTechniques from "./LbaJobTechniques"

const getContractTypes = (contractTypes) => {
  return contractTypes instanceof Array ? contractTypes.join(", ") : contractTypes
}

const getDescriptionContext = (job: ILbaItemLbaJob) => {
  return (
    <Accordion allowToggle>
      <LbaJobCompetences job={job} />
      <LbaJobTechniques job={job} />
      <LbaJobAcces job={job} />
    </Accordion>
  )
}

const LbaJobDetail = ({ job }) => {
  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0].scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Offre LBA", {
      info_fiche: `${job?.job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    notifyLbaJobDetailView(job?.job?.id)
  }, [job?.job?.id])

  const jobStartDate = job?.job?.jobStartDate ? formatDate(job.job.jobStartDate) : undefined

  const { formValues } = React.useContext(DisplayContext)

  return (
    <>
      <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text as="h2" variant="itemDetailH2" mt={2} mb={4}>
          Description de l&apos;offre
        </Text>
        <Box p={4} mb={6} borderRadius="8px" background="#f6f6f6">
          <Box>
            <strong>Début du contrat le : </strong> {jobStartDate}
          </Box>
          {job?.job?.dureeContrat && (
            <Box my={2}>
              <strong>Durée du contrat : </strong> {job?.job?.dureeContrat} mois
            </Box>
          )}
          <Box my={2}>
            <strong>Nature du contrat : </strong> {getContractTypes(job?.job?.contractType)}
          </Box>
          {job?.job?.quantiteContrat > 1 && (
            <Box my={2}>
              <strong>Nombre de postes disponibles: </strong> {job?.job?.quantiteContrat}
            </Box>
          )}
          <Flex direction="row" wrap="wrap">
            <strong>Niveau visé en fin d&apos;études :</strong>{" "}
            {job?.diplomaLevel ? (
              <Flex direction="row" wrap="wrap">
                {job?.diplomaLevel.split(", ").map(function (d, idx) {
                  return (
                    <Text as="span" key={idx} fontSize="14px" textAlign="center" color="bluefrance.500" background="#e3e3fd" py={1} px={4} borderRadius="40px" ml={2} mb={1}>
                      {d}
                    </Text>
                  )
                })}
              </Flex>
            ) : (
              "non défini"
            )}
          </Flex>

          {job?.job?.elligibleHandicap && (
            <Flex mt={2} p={2} background="white" justifyContent="center" fontSize="12px" alignItems="center" direction="row">
              <Box width="30px" minWidth="30px" mr={2}>
                <Image mt="2px" src="/images/info.svg" alt="" aria-hidden={true} />
              </Box>
              <Box>À compétences égales, une attention particulière sera apportée aux personnes en situation de handicap.</Box>
            </Flex>
          )}
        </Box>
        {job?.company?.mandataire && (
          <Text>
            Offre publiée par{" "}
            <Text as="span" color="pinksoft.600" fontWeight={700}>
              {job.company.name}
            </Text>{" "}
            pour une entreprise partenaire du centre de formation.
          </Text>
        )}

        <Accordion allowToggle defaultIndex={0}>
          <LbaJobDescription job={job} />
          <LbaJobQualites job={job} />
        </Accordion>
        <Box marginTop="10px">
          <ReportJobLink
            width="480px"
            itemId={job?.job?.id}
            type={LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}
            linkLabelNotReported="Signaler l'offre"
            linkLabelReported="Offre signalée"
            tooltip={
              <Box>
                <Text fontSize="16px" lineHeight="24px" fontWeight="700" marginBottom="8px" color="#161616">
                  Cette offre vous semble inappropriée ? Voici les raisons pour lesquelles vous pouvez nous signaler une offre :
                </Text>
                <UnorderedList
                  style={{
                    color: "#383838",
                    fontSize: "16px",
                    lineHeight: "24px",
                  }}
                >
                  <ListItem>Offre offensante ou discriminatoire</ListItem>
                  <ListItem>Offre inexacte ou expirée</ListItem>
                  <ListItem>Fausse offre provenant d’un centre de formation</ListItem>
                  <ListItem>Tentative d'escroquerie</ListItem>
                </UnorderedList>
              </Box>
            }
          />
        </Box>
      </Box>

      <Flex padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Box mt={2} width="30px" minWidth="30px" mr={2}>
          <Image mt="2px" src="/images/whisper.svg" alt="" aria-hidden={true} />
        </Box>
        <Box>
          <Text as="div" fontWeight={700} fontSize="20px" color="#3a3a3a">
            Psst !
          </Text>
          <Box color="grey.700">
            Pour convaincre l’entreprise de vous embaucher,{" "}
            <Link isExternal textDecoration="underline" href="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e">
              on vous donne des conseils ici pour vous aider !
            </Link>
          </Box>
        </Box>
      </Flex>

      <Box pb="0px" position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text as="h2" variant="itemDetailH2" mt={2}>{`En savoir plus sur le métier ${job.title}`}</Text>
        <Box data-testid="lbb-component">
          <Box mb={4}>{getDescriptionContext(job)}</Box>
        </Box>
      </Box>

      <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text as="h2" variant="itemDetailH2" mt={2}>
          Quelques informations sur {job?.company?.mandataire ? "l'entreprise" : "l'établissement"}
        </Text>

        <Text my={2}>
          {job?.company?.mandataire
            ? "Le centre de formation peut vous renseigner sur l’entreprise."
            : "Renseignez-vous sur l’entreprise, ses activités et ses valeurs pour préparer votre candidature. Vous pouvez rechercher leur site internet et leur présence sur les réseaux sociaux."}
        </Text>

        {!job?.company?.mandataire ? (
          <ItemLocalisation item={job} />
        ) : (
          <Text>
            <Text as="span" fontWeight={700}>
              Localisation :{" "}
            </Text>
            <Text as="span">{job.place.city}</Text>
            <ItemDistanceToCenter item={job} />
          </Text>
        )}

        <Text>
          <Text as="span" fontWeight={700}>
            Secteur d'activité :{" "}
          </Text>
          <Text as="span">{job.nafs[0].label}</Text>
        </Text>

        <Text>
          <Text as="span" fontWeight={700}>
            Taille de l'entreprise :{" "}
          </Text>
          <Text as="span">{getCompanySize(job)}</Text>
        </Text>

        {!job?.company?.mandataire && job?.contact?.phone && (
          <Text>
            <Text as="span" fontWeight={700}>
              Téléphone :{" "}
            </Text>
            <Text as="span">
              <Link ml="2px" isExternal variant="basicUnderlined" href={`tel:${job.contact.phone}`} aria-label="Appeler la société au téléphone">
                {job.contact.phone} <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Text>
          </Text>
        )}

        {!job?.company?.mandataire && <ItemGoogleSearchLink item={job} />}
      </Box>

      {job?.company?.mandataire && (
        <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
          <Text as="h2" variant="itemDetailH2" mt={2}>
            Contactez le CFA pour avoir plus d’informations
          </Text>

          <Text my={2}>Le centre de formation peut vous renseigner sur les formations qu’il propose.</Text>
          <ItemLocalisation item={job.company} />

          {job?.contact?.phone && (
            <Flex mt={2} mb={4}>
              <Box fontWeight={700} pl="2px" mr={2}>
                Téléphone :
              </Box>
              <Link ml="2px" isExternal variant="basicUnderlined" href={`tel:${job.contact.phone}`} aria-label="Contacter par téléphone - nouvelle fenêtre">
                {job.contact.phone} <ExternalLinkIcon mx="2px" />
              </Link>
            </Flex>
          )}

          <ItemGoogleSearchLink item={job} />
        </Box>
      )}
    </>
  )
}

export default LbaJobDetail
