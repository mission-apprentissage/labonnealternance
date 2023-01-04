import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, Image, Link, Text } from "@chakra-ui/react"
import React, { useEffect } from "react"
import { DisplayContext } from "../../context/DisplayContextProvider"
import { SendPlausibleEvent, SendTrackEvent } from "../../utils/plausible"
import { formatDate } from "../../utils/strutils"
import MatchaAcces from "./MatchaComponents/MatchaAcces"
import MatchaCompetences from "./MatchaComponents/MatchaCompetences"
import MatchaDescription from "./MatchaComponents/MatchaDescription"

const getContractTypes = (contractTypes) => {
  return contractTypes instanceof Array ? contractTypes.join(", ") : contractTypes
}

const MatchaDetail = ({ job, seeInfo, setSeeInfo }) => {
  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0].scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Offre LBA", {
      info_fiche: `${job?.job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    SendTrackEvent({
      event: `Résultats Affichage Offre Matcha - Consulter fiche entreprise`,
      itemId: job?.job?.id,
    })
  }, [job?.job?.id])

  const jobStartDate = job?.job?.jobStartDate ? formatDate(job.job.jobStartDate) : undefined

  const { formValues } = React.useContext(DisplayContext)

  return (
    <>
      <Box pb="0px" mt={6} position="relative" background="white" padding={["1px 12px 50px 12px", "1px 24px 50px 24px", "1px 12px 24px 12px"]} mx={["0", "30px"]}>
        <Text as="h2" variant="itemDetailH2" mt={2}>
          Description de l&apos;offre
        </Text>
        <Box p={4} mb={6} borderRadius="8px" background="#f6f6f6">
          <Box>
            <strong>Début du contrat le : </strong> {jobStartDate}
          </Box>
          <Box my={2}>
            <strong>Nature du contrat : </strong> {getContractTypes(job?.job?.contractType)}
          </Box>
          <Box>
            <strong>Niveau visé en fin d&apos;études :</strong>{" "}
            {job?.diplomaLevel ? (
              <Flex direction="row" wrap="wrap">
                {job?.diplomaLevel.split(", ").map(function (d, idx) {
                  return (
                    <Text as="span" key={idx} fontSize="14px" textAlign="center" color="bluefrance.500" background="#e3e3fd" py={1} px={4} borderRadius="40px" ml={2} mt={1}>
                      {d}
                    </Text>
                  )
                })}
              </Flex>
            ) : (
              "non défini"
            )}
          </Box>

          {job?.job?.elligibleHandicap && (
            <Flex mt={4} p={2} background="white" justifyContent="center" fontSize="12px" alignItems="center" direction="row">
              <Box width="30px" minWidth="30px" mr={2}>
                <Image mt="2px" src="/images/info.svg" alt="" />
              </Box>
              <Box>À compétences égales, une attention particulière sera apportée aux personnes en situation de handicap.</Box>
            </Flex>
          )}
        </Box>
        {job?.company?.mandataire ? (
          <Text>
            Offre publiée par{" "}
            <Text as="span" color="pinksoft.600" fontWeight={700}>
              {job.company.name}
            </Text>{" "}
            pour une entreprise partenaire du centre de formation.
          </Text>
        ) : (
          <>
            <Text>
              <Text as="span" color="pinksoft.600" fontWeight={700}>
                {job.company.name}
              </Text>{" "}
              recrute dans le domaine suivant
              <Text as="span" color="pinksoft.600" fontWeight={700}>
                {job.title}
              </Text>
              . Cela signifie que l&apos;établissement est activement à la recherche d&apos;un.e candidat.e.
            </Text>
            <Text>Vous avez donc tout intérêt à le contacter rapidement, avant que l&apos;offre ne soit pourvue !</Text>
            <Box mb="0">
              Trouver et convaincre une entreprise de vous embaucher ?
              <br />
              <Link
                isExternal
                variant="basicUnderlined"
                href="https://dinum-beta.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
                aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA"
              >
                On vous donne des conseils ici pour vous aider !
                <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Box>
          </>
        )}
      </Box>

      {job?.job.romeDetails && (
        <Box pb="0px" mt={6} position="relative" background="white" padding={["1px 12px 1px 12px", "1px 24px 50px 24px", "1px 12px 1px 12px"]} mx={["0", "30px"]}>
          <Text as="h2" variant="itemDetailH2" mt={2}>{`En savoir plus sur ${job.title}`}</Text>
          <Box data-testid="lbb-component">
            <Box mb={4}>
              <MatchaDescription job={job} />
              <MatchaCompetences job={job} />
              <MatchaAcces job={job} />
            </Box>
          </Box>
        </Box>
      )}
    </>
  )
}

export default MatchaDetail
