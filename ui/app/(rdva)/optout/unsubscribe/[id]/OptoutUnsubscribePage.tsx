"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Container, FormControlLabel, Radio, RadioGroup, Stack, Typography } from "@mui/material"
import { captureException } from "@sentry/browser"
import type { FormEvent, ReactNode } from "react"
import { useId, useRef, useState } from "react"
import type { IEtablissementJson } from "shared"

import { SuccessCircle, Warning } from "@/theme/components/icons"
import { apiPost } from "@/utils/api.utils"

const EtablissementField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <Typography component="dt" sx={{ display: "inline", p: 0 }}>
      {label} :
    </Typography>{" "}
    <Typography component="dd" sx={{ display: "inline", m: 0, p: 0, fontWeight: 700 }}>
      {children}
    </Typography>
  </div>
)

export type IEtablissementPartial = Pick<
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

export default function OptOutUnsubscribe({ id, token, etablissement }: { id: string; token: string; etablissement: IEtablissementPartial }) {
  const radioOptions = {
    UNSUBSCRIBE_NO_DETAILS: "unsubscribe_no_details",
    UNSUBSCRIBE_MORE_DETAILS: "unsubscribe_more_details",
  }

  const [textarea, setTextarea] = useState("")
  const [hasJustUnsubscribed, setHasJustUnsubscribed] = useState(false)
  const [isQuestionSent, setIsQuestionSent] = useState(false)
  const [radioValue, setRadioValue] = useState(radioOptions.UNSUBSCRIBE_NO_DETAILS)
  const [hasSubmitAttempt, setHasSubmitAttempt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitError, setHasSubmitError] = useState(false)
  const questionRef = useRef<HTMLTextAreaElement>(null)

  const fieldId = useId()
  const legendId = `${fieldId}-legend`
  const etablissementId = `${fieldId}-etablissement`
  const noDetailsId = `${fieldId}-no-details`
  const moreDetailsId = `${fieldId}-more-details`

  const hasBeenUnsubscribed = hasJustUnsubscribed || Boolean(etablissement.optout_refusal_date)
  const isMoreDetails = radioValue === radioOptions.UNSUBSCRIBE_MORE_DETAILS
  const question = textarea.trim()
  const hasQuestionError = hasSubmitAttempt && isMoreDetails && !question

  // Saisir une question sélectionne la seconde option, sans quoi la question serait ignorée à l'envoi.
  const handleTextarea = (event) => {
    setTextarea(event.target.value)
    if (event.target.value) {
      setRadioValue(radioOptions.UNSUBSCRIBE_MORE_DETAILS)
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasSubmitAttempt(true)
    setHasSubmitError(false)
    if (isMoreDetails && !question) {
      questionRef.current?.focus()
      return
    }

    const opt_out_question = isMoreDetails ? question : undefined

    setIsSubmitting(true)
    try {
      await apiPost("/etablissements/:id/opt-out/unsubscribe", {
        params: { id },
        body: { opt_out_question },
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      captureException(error)
      setHasSubmitError(true)
      return
    } finally {
      setIsSubmitting(false)
    }

    window.scrollTo(0, 0)

    if (opt_out_question) {
      setIsQuestionSent(true)
    } else {
      setHasJustUnsubscribed(true)
    }
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
        <form onSubmit={submit} noValidate>
          <Typography id={legendId} sx={{ fontWeight: 700, mb: fr.spacing("4v") }}>
            Votre décision concernant le service RDV Apprentissage
          </Typography>
          <RadioGroup name="decision" aria-labelledby={legendId} onChange={(e) => setRadioValue(e.target.value)} value={radioValue}>
            <Stack gap={fr.spacing("4v")}>
              <FormControlLabel
                htmlFor={noDetailsId}
                label="Je confirme ne pas souhaiter activer le service RDV Apprentissage sur toutes les formations de l’organisme suivant :"
                control={<Radio id={noDetailsId} slotProps={{ input: { "aria-describedby": etablissementId } }} />}
                value={radioOptions.UNSUBSCRIBE_NO_DETAILS}
              />
              <Stack id={etablissementId} component="dl" gap={fr.spacing("2v")} sx={{ backgroundColor: "#E5E5E5", p: fr.spacing("6v"), m: 0 }}>
                <EtablissementField label="Raison sociale">{etablissement.raison_sociale}</EtablissementField>
                <EtablissementField label="SIRET">{etablissement.formateur_siret}</EtablissementField>
                <EtablissementField label="Adresse">{etablissement.formateur_address}</EtablissementField>
                <EtablissementField label="Code postal">{etablissement.formateur_zip_code}</EtablissementField>
                <EtablissementField label="Ville">{etablissement.formateur_city}</EtablissementField>
              </Stack>

              <FormControlLabel
                htmlFor={moreDetailsId}
                label="J’ai besoin d’informations complémentaires avant de prendre ma décision."
                control={<Radio id={moreDetailsId} />}
                value={radioOptions.UNSUBSCRIBE_MORE_DETAILS}
              />
              <Input
                label="Vos questions"
                hintText="Obligatoire si vous avez besoin d’informations complémentaires."
                textArea
                state={hasQuestionError ? "error" : "default"}
                stateRelatedMessage={hasQuestionError ? "Saisissez vos questions pour que l’équipe RDV Apprentissage puisse vous répondre." : undefined}
                nativeTextAreaProps={{
                  ref: questionRef,
                  name: "opt_out_question",
                  rows: 4,
                  value: textarea,
                  onChange: handleTextarea,
                  "aria-invalid": hasQuestionError,
                }}
              />
            </Stack>
          </RadioGroup>
          {hasSubmitError && (
            <Box role="alert" sx={{ display: "flex", alignItems: "center", color: fr.colors.decisions.text.actionHigh.redMarianne.default, mt: fr.spacing("4v") }}>
              <Warning sx={{ m: 0 }} />
              <Box sx={{ ml: fr.spacing("2v") }}>Une erreur technique s'est produite. Veuillez réessayer ultérieurement.</Box>
            </Box>
          )}
          <Box sx={{ my: fr.spacing("10v") }}>
            <Button type="submit" disabled={isSubmitting}>
              Envoyer
            </Button>
          </Box>
        </form>
      )}
    </Container>
  )
}
