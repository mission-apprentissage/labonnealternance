import { useParams } from "react-router-dom"
import { Box, Text } from "@chakra-ui/react"
import { FormLayoutComponent } from "./Candidat/layout/FormLayoutComponent"
import { useFetch } from "../common/hooks/useFetch"
import { useEffect } from "react"
import { _patch } from "../common/httpClient"

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
              <Text as="span" color="bluefrance" textStyle="h6">
                Voici les coordonnées du candidat
              </Text>
              <Box mt={6} pb={10} borderBottom="solid 1px #D0C9C4">
                <Text>
                  Nom :{" "}
                  <Text as="span" fontWeight="700">
                    {data.user.lastname}
                  </Text>
                </Text>
                <Text>
                  Prénom :{" "}
                  <Text as="span" fontWeight="700">
                    {data.user.firstname}
                  </Text>
                </Text>
                <Text mt={4}>
                  Numéro de téléphone :{" "}
                  <Text as="span" fontWeight="700">
                    {data.user.phone.match(/.{1,2}/g).join(".")}
                  </Text>
                </Text>
                <Text>
                  Email :{" "}
                  <Text as="span" fontWeight="700">
                    {data.user.email}
                  </Text>
                </Text>
              </Box>
              <Text mt={10}>
                Il ou elle souhaite aborder avec vous le(s) sujet(s) suivant :
                <br />"{data.appointment.motivations}" <br /> à propos de la formation :{" "}
                <Text as="span" fontWeight="700">
                  {data.etablissement.intitule_long}
                </Text>
                <br />
                dispensé par :{" "}
                <Text as="span" fontWeight="700">
                  {data.etablissement.etablissement_formateur_entreprise_raison_sociale}
                </Text>
              </Text>
            </Box>
          )}
        </>
      )}
    </FormLayoutComponent>
  )
}
