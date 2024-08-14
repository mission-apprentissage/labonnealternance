import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, Image, Link, Text } from "@chakra-ui/react"
import React, { Fragment, useContext, useEffect, useState } from "react"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import fetchInserJeuneStats from "../../services/fetchInserJeuneStats"
import fetchPrdv from "../../services/fetchPrdv"
import { SendPlausibleEvent } from "../../utils/plausible"
import { formatDate } from "../../utils/strutils"

import StatsInserJeunes from "./StatsInserJeunes"

// Read https://css-tricks.com/snippets/css/prevent-long-urls-from-breaking-out-of-container/
const dontBreakOutCssParameters = {
  overflowWrap: "break-word",
  wordWrap: "break-word",
  wordBreak: "break-word",
  hyphens: "auto",
}

const TrainingDetail = ({ training, hasAlsoJob }) => {
  const [IJStats, setIJStats] = useState(null)

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche formation", {
      info_fiche: `${training.cleMinistereEducatif}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
  }, [training.id])

  useEffect(() => {
    async function getStats() {
      setIJStats(null)
      const stats = await fetchInserJeuneStats(training)
      setIJStats(stats)
    }
    getStats()
  }, [training.id])

  const { trainings, setTrainingsAndSelectedItem } = useContext(SearchResultContext)
  const { formValues } = React.useContext(DisplayContext)

  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0].scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  useEffect(() => {
    if (!training.prdvLoaded) {
      fetchPrdv(training, hasAlsoJob).then((result) => {
        if (result) {
          applyDataFromRdvA(result.error === "indisponible" ? "" : result)
        }
      })
    }
  }, [training.id])

  const applyDataFromRdvA = (appointmentContextResponse) => {
    const updatedTrainings = trainings
    updatedTrainings.forEach(async (v) => {
      if (v.id === training.id) {
        if (!v.prdvLoaded) {
          v.prdvLoaded = true
          v.rdvContext = appointmentContextResponse
          setTrainingsAndSelectedItem(updatedTrainings, v)
        }
      }
    })
  }

  return (
    <Box
      pb="0px"
      mt={6}
      position="relative"
      background="white"
      padding={["1px 12px 36px 12px", "1px 24px 36px 24px", "1px 12px 24px 12px"]}
      maxWidth="970px"
      mx={["0", "30px", "30px", "auto"]}
    >
      {getTrainingDetails(training.training)}
      <Box background="#f6f6f6" borderRadius="8px" mt={8} pl={8} py="10px" pr="10px">
        {training.onisepUrl && (
          <Box>
            <Text as="span">Descriptif du {training.title ? training.title : training.longTitle} sur&nbsp;</Text>
            <Text as="span">
              <Link variant="basicUnderlined" href={training.onisepUrl} isExternal aria-label="Formation sur le site de l'onisep - nouvelle fenêtre">
                le site Onisep&nbsp;
                <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Text>
          </Box>
        )}
        <Box my={2}>
          Vous vous posez des questions sur votre orientation ou votre recherche d&apos;emploi ?&nbsp;
          <Link
            isExternal
            variant="basicUnderlined"
            href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
            aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA - nouvelle fenêtre"
          >
            Préparez votre premier contact avec un CFA&nbsp;
            <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </Box>
      </Box>
      {IJStats && <StatsInserJeunes stats={IJStats} />}
    </Box>
  )
}

const getTrainingDetails = (training) => {
  if (!training) return ""

  const res = (
    <>
      {training.description && training.description.length > 30 && (
        <Flex alignItems="flex-start" mt={5}>
          <Image src="/images/icons/traning-clipboard-list.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Description de la formation
            </Text>
            <Text as="span" sx={dontBreakOutCssParameters}>
              {training.description}
            </Text>
          </Box>
        </Flex>
      )}

      {training.objectif && training.objectif.length > 20 && (
        <Flex alignItems="flex-start" mt={10}>
          <Image mt={1} src="/images/icons/training-target.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Objectifs
            </Text>
            <Text as="span" sx={dontBreakOutCssParameters}>
              {training.objectif}
            </Text>
          </Box>
        </Flex>
      )}

      {training["sessions"]?.length ? (
        <Flex alignItems="flex-start" mt={10}>
          <Image src="/images/icons/training-academic-cap.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Sessions de formation
            </Text>
            {training["sessions"][0].isPermanentEntry
              ? "Il est possible de s’inscrire à cette formation tout au long de l’année."
              : training["sessions"].map((session, i) => (
                  <Fragment key={i}>
                    du {formatDate(session.startDate)} au {formatDate(session.endDate)}
                    <br />
                  </Fragment>
                ))}
          </Box>
        </Flex>
      ) : (
        <></>
      )}

      {getTrainingSessions(training)}
    </>
  )

  return res
}

const getTrainingSessions = (training) => {
  if (training.sessions) {
    const sessions = []
    const today = new Date().getTime()
    training.sessions.forEach((s) => {
      if (new Date(s.debut).getTime() > today) {
        if (sessions.findIndex((v) => s.debut === v.debut && s.fin === v.fin) < 0) {
          sessions.push({ debut: s.debut, fin: s.fin })
        }
      }
    })

    return (
      sessions.length > 0 && (
        <Flex alignItems="flex-start" mt={10}>
          <Image src="/images/icons/traning-clipboard-list.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Sessions
            </Text>
            {sessions.map((session, idx) => {
              return (
                <Box key={`session${idx}`}>
                  Début : {formatDate(session.debut)} - Fin : {formatDate(session.fin)}
                </Box>
              )
            })}
            <Box>&nbsp;</Box>
          </Box>
        </Flex>
      )
    )
  } else {
    return <></>
  }
}

export default TrainingDetail
