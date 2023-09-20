import { Box, Text, UnorderedList, ListItem } from "@chakra-ui/react"
import { useFormik } from "formik"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import * as Yup from "yup"

import { useFetch } from "../../../../../common/hooks/useFetch"
import { _patch, _post } from "../../../../../common/httpClient"
import { formatDate } from "../../../../../common/utils/dateUtils"
import { getReasonText } from "../../../../../common/utils/reasonsUtils"
import { FormLayoutComponent } from "../../../../../components/espace_pro/Candidat/layout/FormLayoutComponent"
import { CfaCandidatInformationAnswered } from "../../../../../components/espace_pro/CfaCandidatInformationPage/CfaCandidatInformationAnswered"
import { CfaCandidatInformationForm } from "../../../../../components/espace_pro/CfaCandidatInformationPage/CfaCandidatInformationForm"
import { CfaCandidatInformationOther } from "../../../../../components/espace_pro/CfaCandidatInformationPage/CfaCandidatInformationOther"
import { CfaCandidatInformationUnreachable } from "../../../../../components/espace_pro/CfaCandidatInformationPage/CfaCandidatInformationUnreachable"


/**
 * @description CfaCandidatInformationPage component.
 * @returns {JSX.Element}
 */
export default function CfaCandidatInformationPage() {
  const router = useRouter()
  const { establishmentId, appointmentId } = router.query
  const [data, loading] = useFetch(`/api/appointment-request/context/recap?appointmentId=${appointmentId}`)

  const [currentState, setCurrentState] = useState("initial")

  const utmSource = new URLSearchParams(window.location.search).get("utm_source")

  const formik = useFormik({
    initialValues: {
      message: "",
    },
    validationSchema: Yup.object({ message: Yup.string().required("Veuillez remplir le message") }),
    onSubmit: async (values) => {
      setCurrentState("sending")
      await _post("/appointment-request/reply", {
        appointment_id: appointmentId,
        cfa_intention_to_applicant: "personalised_answer",
        cfa_message_to_applicant: values.message,
        cfa_message_to_applicant_date: formatDate(new Date()),
      })
      setCurrentState("answered")
    },
  })

  const otherClicked = async () => {
    setCurrentState("sending")
    await _post("appointment-request/reply", {
      appointment_id: appointmentId,
      cfa_intention_to_applicant: "other_channel",
      cfa_message_to_applicant: "",
      cfa_message_to_applicant_date: formatDate(new Date()),
    })
    setCurrentState("other")
  }
  const unreachableClicked = async () => {
    setCurrentState("sending")
    await _post("appointment-request/reply", {
      appointment_id: appointmentId,
      cfa_intention_to_applicant: "no_answer",
      cfa_message_to_applicant: "",
      cfa_message_to_applicant_date: formatDate(new Date()),
    })
    setCurrentState("unreachable")
  }

  /**
   * @description Set has "read" if there is utm_source=mail query string.
   * @returns {Promise<void>}
   */
  useEffect(async () => {
    if (utmSource === "mail") {
      await _patch(`etablissements/${establishmentId}/appointments/${appointmentId}`, { has_been_read: true })
    }
  }, [utmSource])

  return (
    <FormLayoutComponent
      headerText={
        <>
          Un candidat souhaite <br />
          être contacté <br />
          <Text textStyle="h2" as="span" color="grey.700">
            par votre centre de formation
          </Text>
        </>
      }
    >
      {loading && <span>Chargement des données...</span>}
      {data?.user && (
        <Box mt={10}>
          <Text as="span" color="bluefrance" textStyle="h6">
            Voici les coordonnées du contact
          </Text>
          {data.user?.type && (
            <Text fontWeight="700" mb={4}>
              {data.user.type === "parent" ? "Le parent" : "L'étudiant"}
            </Text>
          )}
          <Box mt={6} pb={8} borderBottom="solid 1px #D0C9C4">
            <Text>
              Nom :{" "}
              <Text as="span">
                <strong>{data.user.lastname}</strong>
              </Text>
            </Text>
            <Text>
              Prénom :{" "}
              <Text as="span">
                <b>{data.user.firstname}</b>
              </Text>
            </Text>
            <Text mt={4}>
              Numéro de téléphone :{" "}
              <Text as="span">
                <b>{data.user.phone.match(/.{1,2}/g).join(".")}</b>
              </Text>
            </Text>
            <Text>
              Email :{" "}
              <Text as="span">
                <b>{data.user.email}</b>
              </Text>
            </Text>
          </Box>
          <Box mt={8} pb={8} borderBottom="solid 1px #D0C9C4">
            <Text as="p" my="2">
              Il ou elle souhaite aborder avec vous le(s) sujet(s) suivant(s) :
            </Text>
            <Text as="p" my="2">
              <UnorderedList>
                {(data.appointment?.applicant_reasons || []).map((reason, i) => {
                  return <ListItem key={i}>{getReasonText(reason)}</ListItem>
                })}
              </UnorderedList>
            </Text>
            {(data.appointment?.applicant_reasons || []).includes("autre") ? (
              <Text as="p" bg="#F6F6F6" color="#2A2A2A" fontSize="16px" lineHeight="24px" fontWeight="700" px="4" py="2">
                {data.appointment.applicant_message_to_cfa}
              </Text>
            ) : (
              <Text as="div" marginTop={2}></Text>
            )}
            <Text as="p" mt="2">
              à propos de la formation : <strong>{data.etablissement.training_intitule_long}</strong>
            </Text>
            <Text as="p" mt="1">
              dispensée par :{" "}
              <strong>
                {data.etablissement.etablissement_formateur_raison_sociale}, {data.etablissement.lieu_formation_street}, {data.etablissement.lieu_formation_zip_code},{" "}
                {data.etablissement.lieu_formation_city}
              </strong>
            </Text>
          </Box>
          {currentState === "initial" ? (
            <CfaCandidatInformationForm formik={formik} setCurrentState={setCurrentState} otherClicked={otherClicked} unreachableClicked={unreachableClicked} />
          ) : (
            <></>
          )}
          {currentState === "sending" ? <div>Envoi en cours...</div> : <></>}
          {currentState === "answered" ? <CfaCandidatInformationAnswered msg={formik.values.message} /> : <></>}
          {currentState === "other" ? <CfaCandidatInformationOther /> : <></>}
          {currentState === "unreachable" ? <CfaCandidatInformationUnreachable /> : <></>}
        </Box>
      )}
    </FormLayoutComponent>
  )
}
