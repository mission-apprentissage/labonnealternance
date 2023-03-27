import * as Yup from "yup"
import { useParams } from "react-router-dom"
import { Box, Text, UnorderedList, ListItem } from "@chakra-ui/react"
import { FormLayoutComponent } from "../Candidat/layout/FormLayoutComponent"
import { useFetch } from "../../common/hooks/useFetch"
import { useEffect, useState } from "react"
import { _patch } from "../../common/httpClient"
import { useFormik } from "formik"
import { CfaCandidatInformationForm } from "./CfaCandidatInformationForm"
import { CfaCandidatInformationAnswered } from "./CfaCandidatInformationAnswered"
import { CfaCandidatInformationOther } from "./CfaCandidatInformationOther"
import { CfaCandidatInformationUnreachable } from "./CfaCandidatInformationUnreachable"

/**
 * @description CfaCandidatInformationPage component.
 * @returns {JSX.Element}
 */
export const CfaCandidatInformationPage = () => {
  const { establishmentId, appointmentId } = useParams()
  const [data, loading] = useFetch(`/api/appointment-request/context/recap?appointmentId=${appointmentId}`)

  const [currentState, setCurrentState] = useState("initial")

  const utmSource = new URLSearchParams(window.location.search).get("utm_source")

  const formik = useFormik({
    initialValues: {
      message: "",
    },
    validationSchema: Yup.object({ message: Yup.string().required("Veuillez remplir le message") }),
    onSubmit: async (values) => {
      setCurrentState("answered")
      console.log("submit")
      console.log(values)
      console.log(formik)
    },
  })

  /**
   * @description Set has "read" if there is utm_source=mail query string.
   * @returns {Promise<void>}
   */
  useEffect(async () => {
    if (utmSource === "mail") {
      await _patch(`/api/etablissements/${establishmentId}/appointments/${appointmentId}`, { has_been_read: true })
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
      {data && (
        <>
          {data.user && (
            <Box mt={10}>
              <Text as="span" color="bluefrance" textStyle="h6">
                Voici les coordonnées du candidat
              </Text>
              <Box mt={6} pb={8} borderBottom="solid 1px #D0C9C4">
                <Text>
                  Nom :{" "}
                  <Text as="span">
                    <b>{data.user.lastname}</b>
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
                Il ou elle souhaite aborder avec vous le(s) sujet(s) suivant :
                <UnorderedList>
                  <ListItem fontSize="16px" my="2" lineHeight="24px" fontWeight="700">
                    Modalités d'inscription
                  </ListItem>
                  <ListItem fontSize="16px" mb="2" lineHeight="24px" fontWeight="700">
                    Portes ouvertes
                  </ListItem>
                  <ListItem fontSize="16px" mb="2" lineHeight="24px" fontWeight="700">
                    Autre sujet :
                  </ListItem>
                </UnorderedList>
                <Text as="p" bg="#F6F6F6" color="#2A2A2A" fontSize="16px" lineHeight="24px" fontWeight="700" px="4" py="2">
                  {data.appointment.motivations}
                </Text>
                <Text as="p" mt="2">
                  à propos de la formation : <strong>{data.etablissement.intitule_long}</strong>
                </Text>
                <Text as="p" mt="1">
                  dispensée par : <strong>{data.etablissement.etablissement_formateur_entreprise_raison_sociale}</strong>
                </Text>
              </Box>
              {currentState === "initial" ? <CfaCandidatInformationForm formik={formik} setCurrentState={setCurrentState} /> : <></>}
              {currentState === "answered" ? <CfaCandidatInformationAnswered msg={formik.values.message} /> : <></>}
              {currentState === "other" ? <CfaCandidatInformationOther /> : <></>}
              {currentState === "unreachable" ? <CfaCandidatInformationUnreachable /> : <></>}
            </Box>
          )}
        </>
      )}
    </FormLayoutComponent>
  )
}
