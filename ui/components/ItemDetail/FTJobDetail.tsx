import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react"
import mdIt from "markdown-it"
import React, { useEffect } from "react"
import ReactHtmlParser from "react-html-parser"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SendPlausibleEvent } from "../../utils/plausible"
import { formatDate } from "../../utils/strutils"

import ItemGoogleSearchLink from "./ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "./ItemDetailServices/ItemLocalisation"
import { ReportJobLink } from "./ReportJobLink"

const md = mdIt().disable(["link", "image"])

const FTJobDetail = ({ job }) => {
  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0].scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Offre FT", {
      info_fiche: `${job?.job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
  }, [job?.job?.id])

  const { formValues } = React.useContext(DisplayContext)

  const description = job?.job?.description
  const contractDuration = job?.job?.contractDescription
  const contractRythm = job?.job?.duration || "Non défini"
  const creationDate = formatDate(job?.job?.creationDate)

  return (
    <>
      <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text as="h2" variant="itemDetailH2" mt={2} mb={4}>
          Description de l&apos;offre
        </Text>
        <Box p={4} mb={6} borderRadius="8px" background="#f6f6f6">
          <Box mb={2}>
            <strong>Publiée le : </strong> {creationDate}
          </Box>
          <Box mb={2}>
            <strong>Nature du contrat : </strong> Alternance
          </Box>
          <Box mb={2}>
            <strong>Durée :</strong> {contractDuration}
          </Box>
          <Box>
            <strong>Rythme :</strong> {contractRythm}
          </Box>
        </Box>
        {description && (
          <Box mt={8}>
            <Box whiteSpace="pre-wrap" pl={4}>
              {ReactHtmlParser(md.render(description))}
            </Box>
          </Box>
        )}
        <Box marginTop="10px">
          <ReportJobLink
            itemId={job?.job?.id}
            type={LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES}
            linkLabelNotReported="Signaler l’offre"
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
      <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text as="h2" variant="itemDetailH2" mt={2}>
          Quelques informations sur l'entreprise
        </Text>
        <Text my={3}>
          Renseignez-vous sur l’entreprise, ses activités et ses valeurs pour préparer votre candidature. Vous pouvez rechercher leur site internet et leur présence sur les réseaux
          sociaux.
        </Text>

        <ItemLocalisation item={job} />

        {job?.nafs?.length && (
          <Text mt={1}>
            <Text as="span" fontWeight={700}>
              Secteur d'activité :{" "}
            </Text>
            <Text as="span">{job?.nafs[0]?.label}</Text>
          </Text>
        )}

        {job?.contact?.phone && (
          <Text mt={1}>
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

        {job?.company?.name && <ItemGoogleSearchLink item={job} />}
      </Box>
    </>
  )
}

export default FTJobDetail
