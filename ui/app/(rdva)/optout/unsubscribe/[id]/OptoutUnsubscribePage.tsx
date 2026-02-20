"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Container, Typography, Box, Stack, TextareaAutosize, Radio, RadioGroup, FormControlLabel, FormControl } from "@mui/material"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { IEtablissementJson } from "shared"

import { SuccessCircle } from "@/theme/components/icons"
import { apiGet, apiPost } from "@/utils/api.utils"

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

    if (opt_out_question) {
      setIsQuestionSent(true)
    } else {
      setHasBeenUnsubscribed(true)
    }
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
    <Container>
      <Typography variant="h3" sx={{ my: fr.spacing("6v") }}>
        Désinscription au service “RDV Apprentissage”
      </Typography>
      {hasBeenUnsubscribed && (
        <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("4v"), my: fr.spacing("6v") }}>
          <SuccessCircle width={33} fillHexaColor="#000091" />
          <Typography component="h3" sx={{ fontWeight: 700 }}>
            Votre désinscription au service “RDV Apprentissage” a bien été prise en compte
          </Typography>
        </Box>
      )}
      {isQuestionSent && (
        <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("4v"), my: fr.spacing("6v") }}>
          <SuccessCircle width={33} fillHexaColor="#000091" />
          <Typography component="h3" sx={{ fontWeight: 700 }}>
            L'équipe “RDV Apprentissage” reviendra vers vous très prochainement pour répondre à vos questions.
          </Typography>
        </Box>
      )}
      {!hasBeenUnsubscribed && !isQuestionSent && (
        <>
          <FormControl>
            <RadioGroup onChange={(e) => setRadioValue(e.target.value)} value={radioValue}>
              <Stack gap={fr.spacing("4v")}>
                <FormControlLabel
                  label="Je confirme ne pas souhaiter activer le service RDV Apprentissage sur toutes les formations de l’organisme suivant :"
                  control={<Radio />}
                  value={radioOptions.UNSUBSCRIBE_NO_DETAILS}
                />
                <Stack gap={fr.spacing("2v")} sx={{ backgroundColor: "#E5E5E5", p: fr.spacing("6v") }}>
                  <Typography>
                    Raison sociale : <strong>{etablissement.raison_sociale}</strong>
                  </Typography>
                  <Typography>
                    SIRET : <strong>{etablissement.formateur_siret}</strong>
                  </Typography>
                  <Typography>
                    Adresse : <strong>{etablissement.formateur_address}</strong>
                  </Typography>
                  <Typography>
                    Code postal : <strong>{etablissement.formateur_zip_code}</strong>
                  </Typography>
                  <Typography>
                    Ville : <strong>{etablissement.formateur_city}</strong>
                  </Typography>
                </Stack>

                <FormControlLabel
                  label={
                    <>
                      J’ai besoin d’informations complémentaires avant de prendre ma décision. <br />
                      Voici les questions que je souhaite poser :
                    </>
                  }
                  control={<Radio />}
                  value={radioOptions.UNSUBSCRIBE_MORE_DETAILS}
                />
                <Box>
                  <TextareaAutosize className={fr.cx("fr-input")} onChange={handleTextarea} value={textarea} onClick={() => setRadioValue(radioOptions.UNSUBSCRIBE_MORE_DETAILS)} />
                </Box>
              </Stack>
            </RadioGroup>
          </FormControl>
          <Box sx={{ my: fr.spacing("10v") }}>
            <Button onClick={submit} disabled={radioValue === radioOptions.UNSUBSCRIBE_MORE_DETAILS && textarea === ""}>
              Envoyer
            </Button>
          </Box>
        </>
      )}
    </Container>
  )
}
