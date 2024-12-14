import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Accordion, Box, Flex, Image, Link, Text } from "@chakra-ui/react"
import Head from "next/head"
import React, { useEffect } from "react"
import { ILbaItemPartnerJob } from "shared"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { formatDate } from "../../../utils/strutils"
import { getCompanySize } from "../ItemDetailServices/getCompanySize"
import { getJobPostingSchema } from "../ItemDetailServices/getJobPostingSchema"
import ItemDistanceToCenter from "../ItemDetailServices/ItemDistanceToCenter"
import ItemGoogleSearchLink from "../ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "../ItemDetailServices/ItemLocalisation"
import ItemWebsiteLink from "../ItemDetailServices/ItemWebsiteLink"
import { JobDescriptionAccordion, JobDescription } from "../ItemDetailServices/JobDescription"

const getContractTypes = (contractTypes) => {
  return contractTypes instanceof Array ? contractTypes.join(", ") : contractTypes
}

export const PartnerJobDetail = ({ job, title }: { job: ILbaItemPartnerJob; title: string }) => {
  useEffect(() => {
    document.getElementsByClassName("choiceCol")[0].scrollTo(0, 0)
  }, [])

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Partner Job", {
      info_fiche: `${job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
  }, [job?.id])

  const jobStartDate = job?.job?.jobStartDate ? formatDate(job.job.jobStartDate) : undefined

  const { formValues } = React.useContext(DisplayContext)

  const jobPostingSchema = getJobPostingSchema({ title, description: job?.job?.description || null, id: job?.id, job })

  return (
    <>
      <Head>
        <script type="application/ld+json">{JSON.stringify(jobPostingSchema)}</script>
      </Head>
      <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text as="h2" variant="itemDetailH2" mt={2} mb={4}>
          Description de l&apos;offre
        </Text>
        <Box p={4} mb={6} borderRadius="8px" background="#f6f6f6">
          {jobStartDate && (
            <Box>
              <strong>Début du contrat le : </strong> {jobStartDate}
            </Box>
          )}
          {job?.job?.dureeContrat && (
            <Box my={2}>
              <strong>Durée du contrat : </strong> {job?.job?.dureeContrat}
            </Box>
          )}
          <Box my={2}>
            <strong>Nature du contrat : </strong> {getContractTypes(job?.job?.type)}
          </Box>

          {job?.target_diploma_level && (
            <Box my={2}>
              <strong>Niveau visé en fin d'études : </strong> {job?.target_diploma_level}
            </Box>
          )}

          {job?.job?.quantiteContrat > 1 && (
            <Box my={2}>
              <strong>Nombre de postes disponibles : </strong> {job?.job?.quantiteContrat}
            </Box>
          )}
        </Box>

        <Accordion allowToggle defaultIndex={0}>
          <JobDescription job={job} />
          <JobDescriptionAccordion title="Qualités souhaitées pour ce métier" items={job?.job?.offer_desired_skills} />
        </Accordion>
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

      {(job?.job?.offer_to_be_acquired_skills?.length > 0 || job?.job?.offer_access_conditions?.length > 0) && (
        <Box pb="0px" position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
          <Text as="h2" variant="itemDetailH2" mt={2}>{`En savoir plus sur le métier ${job.title}`}</Text>
          <Box data-testid="lbb-component">
            <Box mb={4}>
              <Accordion allowToggle>
                <JobDescriptionAccordion title="Compétences qui seront acquises durant l'alternance" items={job?.job?.offer_to_be_acquired_skills} />
                <JobDescriptionAccordion title="À qui ce métier est-il accessible ?" items={job?.job?.offer_access_conditions} />
              </Accordion>
            </Box>
          </Box>
        </Box>
      )}
      <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text as="h2" variant="itemDetailH2" mt={2}>
          Quelques informations sur {job?.company?.mandataire ? "l'entreprise" : "l'établissement"}
        </Text>

        <Text my={3}>
          {job?.company?.mandataire
            ? "Le centre de formation peut vous renseigner sur l’entreprise."
            : "Renseignez-vous sur l’entreprise, ses activités et ses valeurs pour préparer votre candidature. Vous pouvez rechercher leur site internet et leur présence sur les réseaux sociaux."}
        </Text>

        {!job?.company?.mandataire ? (
          <ItemLocalisation item={job} />
        ) : (
          <Text mt={1}>
            <Text as="span" fontWeight={700}>
              Localisation :{" "}
            </Text>
            <Text as="span">{job.place.city}</Text>
            <br />
            <ItemDistanceToCenter item={job} />
          </Text>
        )}

        <Text mt={1}>
          <Text as="span" fontWeight={700}>
            Taille de l'entreprise :{" "}
          </Text>
          <Text as="span">{getCompanySize(job)}</Text>
        </Text>

        {job.nafs[0]?.label && (
          <Text mt={1}>
            <Text as="span" fontWeight={700}>
              Secteur d'activité :{" "}
            </Text>
            <Text as="span">{job.nafs[0].label}</Text>
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
        <ItemWebsiteLink item={job} />
        <ItemGoogleSearchLink item={job} />
      </Box>
    </>
  )
}
