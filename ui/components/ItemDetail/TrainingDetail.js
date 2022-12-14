import React, { useContext, useEffect, useState } from "react"
import { Spinner } from "reactstrap"
import { DisplayContext } from "../../context/DisplayContextProvider"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import academicCapIcon from "../../public/images/icons/training-academic-cap.svg"
import questionmarkIcon from "../../public/images/icons/training-questionmark.svg"
import sablierIcon from "../../public/images/icons/training-sablier.svg"
import targetIcon from "../../public/images/icons/training-target.svg"
import clipboardListIcon from "../../public/images/icons/traning-clipboard-list.svg"
import fetchPrdv from "../../services/fetchPrdv"
import fetchTrainingDetails from "../../services/fetchTrainingDetails"
import sendTrainingOpenedEventToCatalogue from "../../services/sendTrainingOpenedEventToCatalogue"
import { SendPlausibleEvent, SendTrackEvent } from "../../utils/plausible"
import { formatDate } from "../../utils/strutils"
import { Box, Flex, Image, Link, Text } from "@chakra-ui/react"
import { ExternalLinkIcon } from "@chakra-ui/icons"

const TrainingDetail = ({ training, hasAlsoJob }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche formation", {
      info_fiche: `${training.cleMinistereEducatif}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    SendTrackEvent({
      event: `Résultats Affichage formation - Consulter fiche formation`,
      itemId: training.cleMinistereEducatif,
    })

    setLoading(true)
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
          applyDataFromPrdv(result.error === "indisponible" ? "" : result.form_url)
        }
      })
    }
  }, [training.id])

  useEffect(() => {
    if (training && !training.lbfLoaded) {
      loadDataFromLbf()
      sendTrainingOpenedEventToCatalogue(training.cleMinistereEducatif)
    } else {
      setLoading(false)
    }
  }, [training.cleMinistereEducatif])

  const loadDataFromLbf = () => {
    let updatedTrainings = trainings
    updatedTrainings.forEach(async (v) => {
      if (v.id === training.id) {
        if (!v.lbfLoaded) {
          v.lbfLoaded = true

          try {
            const trainingDetail = await fetchTrainingDetails(training)

            updateTrainingFromLbf(v, trainingDetail)
            setTrainingsAndSelectedItem(updatedTrainings, v)
          } catch (err) {}
        }
        setLoading(false)
      }
    })
  }

  const applyDataFromPrdv = (url) => {
    let updatedTrainings = trainings
    updatedTrainings.forEach(async (v) => {
      if (v.id === training.id) {
        if (!v.prdvLoaded) {
          v.prdvLoaded = true

          try {
            v.prdvUrl = url
            setTrainingsAndSelectedItem(updatedTrainings, v)
          } catch (err) {}
        }
        setLoading(false)
      }
    })
  }

  const getLoading = () => {
    return loading ? (
      <span className="trainingColor">
        <div className="searchLoading">
          Chargement en cours
          <Spinner />
        </div>
      </span>
    ) : (
      ""
    )
  }

  return (
    <Box pb="0px" mt={6} position="relative" background="white" padding={["1px 12px 50px 12px", "1px 24px 50px 24px", "1px 12px 24px 12px"]} mx={["0", "30px"]}>
      {getLoading()}
      {getTrainingDetails(training.training)}
      <Box background="#f6f6f6" borderRadius="8px" mt={8} pl={8} py="10px" pr="10px">
        <Flex alignItems="center" pt={1} pb={2}>
          <Image src={questionmarkIcon} alt="" />
          <Text as="span" ml={2} fontWeight={700}>
            {training.title ? training.title : training.longTitle}
          </Text>
        </Flex>
        {training.onisepUrl && (
          <Box>
            <Text as="span">Descriptif du {training.title ? training.title : training.longTitle} sur&nbsp;</Text>
            <Text as="span">
              <Link variant="basicUnderlined" href={training.onisepUrl} isExternal>
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
            href="https://dinum-beta.didask.com/courses/demonstration/60abc18c075edf000065c987"
            aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA"
          >
            Préparez votre premier contact avec un CFA&nbsp;
            <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </Box>
      </Box>
    </Box>
  )
}

const updateTrainingFromLbf = (training, detailsFromLbf) => {
  if (training && detailsFromLbf && detailsFromLbf.organisme) {
    training.training = detailsFromLbf

    // remplacement des coordonnées de contact catalogue par celles de lbf
    const contactLbf = detailsFromLbf.organisme.contact

    training.contact = training.contact || {}

    training.contact.phone = contactLbf.tel || training.contact.phone
    training.contact.email = contactLbf.email || training.contact.email

    training.company.url = contactLbf.url || training.company.url
  }
}

const getTrainingDetails = (training) => {
  if (!training) return ""

  let res = (
    <>
      {training.description ? (
        <div className="c-detail-description is-first media">
          <img src={clipboardListIcon} alt="" />
          <div className="c-detail-training media-body">
            <h3 className="c-detail-description-title mb-3 mt-0">Description de la formation</h3>
            <span className="dont-break-out">{training.description}</span>
          </div>
        </div>
      ) : (
        ""
      )}

      {training.objectif ? (
        <div className="c-detail-description media">
          <img src={targetIcon} alt="" />
          <div className="c-detail-training media-body">
            <h3 className="c-detail-description-title mb-3 mt-0">Objectifs</h3>
            <span className="dont-break-out">{training.objectif}</span>
          </div>
        </div>
      ) : (
        ""
      )}

      {training["duree-indicative"] ? (
        <div className="c-detail-description media">
          <img src={sablierIcon} alt="" />
          <div className="c-detail-training media-body">
            <h3 className="c-detail-description-title mb-3 mt-0">Durée</h3>
            {training["duree-indicative"]}
          </div>
        </div>
      ) : (
        ""
      )}

      {training["sessions"] && training["sessions"].length ? (
        <div className="c-detail-description media">
          <img src={academicCapIcon} alt="" />
          <div className="c-detail-training media-body">
            <h3 className="c-detail-description-title mb-3 mt-0">Modalités alternance</h3>
            Heures en centre de formation : {training["sessions"][0]["nombre-heures-centre"] ? `${training["sessions"][0]["nombre-heures-centre"]}h` : "non renseigné"}
            <br />
            Heures en entreprise : {training["sessions"][0]["nombre-heures-entreprise"] ? `${training["sessions"][0]["nombre-heures-entreprise"]}h` : "non renseigné"}
          </div>
        </div>
      ) : (
        ""
      )}

      {getTrainingSessions(training)}
    </>
  )

  return res
}

const getTrainingSessions = (training) => {
  if (training.sessions) {
    let sessions = []
    let today = new Date().getTime()
    training.sessions.forEach((s) => {
      if (new Date(s.debut).getTime() > today) {
        if (sessions.findIndex((v) => s.debut === v.debut && s.fin === v.fin) < 0) {
          sessions.push({ debut: s.debut, fin: s.fin })
        }
      }
    })

    return sessions.length ? (
      <div className="c-detail-description media">
        <img src={clipboardListIcon} alt="" />
        <div className="c-detail-training media-body">
          <h3 className="c-detail-description-title mb-3 mt-0">Sessions</h3>
          {sessions.map((session, idx) => {
            return (
              <div key={`session${idx}`}>
                Début : {formatDate(session.debut)} - Fin : {formatDate(session.fin)}
              </div>
            )
          })}
          <div>&nbsp;</div>
        </div>
      </div>
    ) : (
      ""
    )
  } else {
    return ""
  }
}

export default TrainingDetail
