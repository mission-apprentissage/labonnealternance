"use client"
import { Box, Container, Flex, Heading, Radio, RadioGroup, Stack, Text, Textarea } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { IEtablissementJson } from "shared"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { apiGet, apiPost } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { SuccessCircle } from "../../../../../theme/components/icons"

type IEtablissementPartial = Pick<
  IEtablissementJson,
  | "_id"
  | "optout_refusal_date"
  | "raison_sociale"
  | "formateur_siret"
  | "formateur_address"
  | "formateur_zip_code"
  | "formateur_city"
  | "premium_affelnet_activation_date"
  | "gestionnaire_siret"
  | "premium_activation_date"
  | "premium_refusal_date"
>

/**
 * @description OptOutUnsubscribe component.
 * @returns {JSX.Element}
 */
export default function OptOutUnsubscribe() {
  const radioOptions = {
    UNSUBSCRIBE_NO_DETAILS: "unsubscribe_no_details",
    UNSUBSCRIBE_MORE_DETAILS: "unsubscribe_more_details",
  }

  const token = useSearchParams().get("token")
  const { id } = useParams() as { id: string }

  const [textarea, setTextarea] = useState("")
  const [hasBeenUnsubscribed, setHasBeenUnsubscribed] = useState(false)
  const [isQuestionSent, setIsQuestionSent] = useState(false)
  const [etablissement, setEtablissement] = useState<undefined | IEtablissementPartial>()
  const [radioValue, setRadioValue] = useState(radioOptions.UNSUBSCRIBE_NO_DETAILS)

  const title = "Désinscription à l'opt out"

  /**
   * @description Save textarea content.
   * @param {Event} event
   * @returns {void}
   */
  const handleTextarea = (event) => setTextarea(event.target.value)

  /**
   * @description Submit unsubscription.
   * @returns {Promise<void>}
   */
  const submit = async () => {
    const opt_out_question = textarea === "" ? undefined : textarea

    await apiPost("/etablissements/:id/opt-out/unsubscribe", {
      params: { id },
      body: { opt_out_question },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    window.scrollTo(0, 0)

    opt_out_question ? setIsQuestionSent(true) : setHasBeenUnsubscribed(true)
  }

  useEffect(() => {
    const fetchData = async () => {
      const etablissement2 = await apiGet("/etablissements/:id", {
        params: { id },
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      if (etablissement2.optout_refusal_date) {
        setHasBeenUnsubscribed(true)
      }

      setEtablissement(etablissement2)
    }

    if (id) {
      fetchData().catch(console.error)
    }
  }, [id, token])

  // Display nothing until date isn't received
  if (!etablissement) {
    return null
  }

  return (
    <Box w="100%" pt={[4]} px={[1, 1, 12, 24]}>
      <Container maxW="996px" pl={20} pr={24}>
        <Breadcrumb pages={[PAGES.dynamic.prdvUnsubscribeOptout({ id })]} />
        <Heading textStyle="h2" mt={5}>
          {title}
        </Heading>
        {hasBeenUnsubscribed && (
          <Flex mb={12}>
            <Box w="40px">
              <SuccessCircle width={33} fillHexaColor="#000091" />
            </Box>
            <Box w="100%">
              <Text textStyle="h3" fontSize="24px" fontWeight="bold" color="grey.800" ml={2}>
                Votre désinscription au service “RDV Apprentissage” a bien été prise en compte
              </Text>
            </Box>
          </Flex>
        )}
        {isQuestionSent && (
          <Flex mb={12}>
            <Box w="40px">
              <SuccessCircle width={33} fillHexaColor="#000091" />
            </Box>
            <Box w="100%">
              <Text textStyle="h3" fontSize="24px" fontWeight="bold" color="grey.800" ml={2}>
                L'équipe “RDV Apprentissage” reviendra vers vous très prochainement pour répondre à vos questions.
              </Text>
            </Box>
          </Flex>
        )}
        {!hasBeenUnsubscribed && !isQuestionSent && (
          <>
            <Box>
              <Text textStyle="h3" fontSize="24px" fontWeight="bold" color="grey.800" ml={2}>
                Désinscription au service “RDV Apprentissage”
              </Text>
            </Box>
            <Flex>
              <RadioGroup marginTop={10} alignItems={"normal"} onChange={setRadioValue} value={radioValue}>
                <Stack>
                  <Radio value={radioOptions.UNSUBSCRIBE_NO_DETAILS} pb={5} alignItems={"normal"}>
                    <Text mt="-7px">Je confirme ne pas souhaiter activer le service RDV Apprentissage sur toutes les formations de l’organisme suivant :</Text>
                    <Box bg="#E5E5E5" px={10} py={6} mt={6} lineHeight="38px">
                      <Text>
                        Raison sociale :{" "}
                        <Text as="span" fontWeight="700">
                          {etablissement.raison_sociale}
                        </Text>
                      </Text>
                      <Text>
                        SIRET :{" "}
                        <Text as="span" fontWeight="700">
                          {etablissement.formateur_siret}
                        </Text>
                      </Text>
                      <Text>
                        Adresse :{" "}
                        <Text as="span" fontWeight="700">
                          {etablissement.formateur_address}
                        </Text>
                      </Text>
                      <Text>
                        Code postal :{" "}
                        <Text as="span" fontWeight="700">
                          {etablissement.formateur_zip_code}
                        </Text>
                      </Text>
                      <Text>
                        Ville :{" "}
                        <Text as="span" fontWeight="700">
                          {etablissement.formateur_city}
                        </Text>
                      </Text>
                    </Box>
                  </Radio>
                  <Radio value={radioOptions.UNSUBSCRIBE_MORE_DETAILS} pt={5} alignItems={"normal"}>
                    <Text mt="-7px">J’ai besoin d’informations complémentaires avant de prendre ma décision. Voici les questions que je souhaite poser :</Text>
                  </Radio>
                  <Box pl={6} pt={5}>
                    <Textarea onChange={handleTextarea} value={textarea} minH={120} onClick={() => setRadioValue(radioOptions.UNSUBSCRIBE_MORE_DETAILS)} />
                  </Box>
                </Stack>
              </RadioGroup>
            </Flex>
            <Box textAlign={"center"} mt={12} mb={14}>
              <Button onClick={submit} disabled={radioValue === radioOptions.UNSUBSCRIBE_MORE_DETAILS && textarea === ""}>
                Envoyer
              </Button>
            </Box>
          </>
        )}
      </Container>
    </Box>
  )
}
