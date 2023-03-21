import { useParams } from "react-router-dom"
import { Box, Text, UnorderedList, ListItem, Textarea, Button, Link } from "@chakra-ui/react"
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
                <Text>
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
                </Text>
              </Box>
              <Box mt={8}>
                <Box p={6} backgroundColor="#F5F5FE;">
                  <Text as="h2" fontWeight="700" color="#000091" fontSize="22px" lineHeight="36px">
                    Votre réponse au candidat
                  </Text>
                  <Text fontWeight="400" color="#161616" fontSize="16px" lineHeight="24px" mt="4">
                    Quelle est votre réponse ?
                  </Text>
                  <Text fontWeight="400" color="#666666" fontSize="12px" lineHeight="20px" mt="1">
                    Le candidat recevra votre réponse directement dans sa boîte mail.
                  </Text>
                  <Textarea my="2" borderRadius="4px 4px 0px 0px" height="200px" width="100%" />
                  <Box>
                    <Button
                      ml={1}
                      mt={4}
                      padding="8px 24px"
                      color="white"
                      background="bluefrance.500"
                      borderRadius="0"
                      sx={{
                        textDecoration: "none",
                        _hover: {
                          background: "bluesoft.500",
                        },
                      }}
                      aria-label="Envoyer la réponse"
                    >
                      Envoyer ma réponse
                    </Button>
                  </Box>
                  <Box mt={6}>
                    <Link to="" fontWeight="500" color="bluefrance.500" fontSize="16px" lineHeight="24px">
                      J'ai répondu au candidat par un autre canal (mail ou téléphone)
                    </Link>
                  </Box>
                  <Box mt={2}>
                    <Link to="" fontWeight="500" color="bluefrance.500" fontSize="16px" lineHeight="24px">
                      Le candidat n'est pas joignable
                    </Link>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}
    </FormLayoutComponent>
  )
}
