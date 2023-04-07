import { Box, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useFetch } from "../common/hooks/useFetch"
import { _patch } from "../common/httpClient"
import { FormLayoutComponent } from "./Candidat/layout/FormLayoutComponent"

/**
 * @description CfaCandidatInformationPage component.
 * @returns {JSX.Element}
 */
export const CfaCandidatInformationPage = () => {
  const { establishmentId, appointmentId } = useParams()
  const [data, loading] = useFetch(`/api/appointment-request/context/recap?appointmentId=${appointmentId}`)

  const utmSource = new URLSearchParams(window.location.search).get("utm_source")

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
              <Text as="span" color="bluefrance.500" fontWeight="700" fontSize="22px">
                Voici les coordonnées du contact :
              </Text>
              <Box mt={6} pb={10} borderBottom="solid 1px #D0C9C4">
                {data.user?.type && (
                  <Text fontWeight="700" mb={4}>
                    {data.user.type === "parent" ? "Le parent" : "L'étudiant"}
                  </Text>
                )}
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
              <Text mt={10}>
                Il ou elle souhaite aborder avec vous le(s) sujet(s) suivant :
                <br />"{data.appointment.applicant_message_to_cfa}"
                <Text>
                  à propos de la formation : <b>{data.etablissement.training_intitule_long}</b>
                </Text>
                <Text>
                  dispensée par :{" "}
                  <b>
                    {data.etablissement.etablissement_formateur_raison_sociale}, {data.etablissement.lieu_formation_street}, {data.etablissement.lieu_formation_zip_code},{" "}
                    {data.etablissement.lieu_formation_city}
                  </b>
                </Text>
              </Text>
            </Box>
          )}
        </>
      )}
    </FormLayoutComponent>
  )
}
