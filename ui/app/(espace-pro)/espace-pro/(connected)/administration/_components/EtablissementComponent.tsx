import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Input, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { createRef, useEffect, useState } from "react"
import { z } from "zod"

import "react-dates/initialize"
import "react-dates/lib/css/_datepicker.css"

import LbaBadge from "@/app/(espace-pro)/_components/Badge"
import { useToast } from "@/app/hooks/useToast"
import { dayjs } from "@/common/dayjs"
import { apiGet, apiPatch } from "@/utils/api.utils"
import { EMAIL_FORMAT_ERROR, EMAIL_FORMAT_HINT } from "@/utils/validation-messages"

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box sx={{ width: "100%" }}>
    <Typography component="dt" sx={{ fontWeight: 700, mb: fr.spacing("2v"), p: 0 }}>
      {label}
    </Typography>
    <Box component="dd" sx={{ m: 0, p: 0 }}>
      {children}
    </Box>
  </Box>
)

const EtablissementComponent = ({ id }: { id?: string }) => {
  const emailGestionnaireRef = createRef<HTMLInputElement>()

  const [etablissement, setEtablissement]: [any, (t: any) => void] = useState(undefined)
  const [emailError, setEmailError] = useState<string | null>(null)
  const toast = useToast()

  const fetchData = async () => {
    try {
      const response = await apiGet("/admin/etablissements/:id", { params: { id } })
      setEtablissement(response ?? null)
    } catch (_error) {
      toast({
        title: "Une erreur est survenue durant la récupération des informations.",
        variant: "error",
      })
    }
  }

  const putError = () =>
    toast({
      title: "Une erreur est survenue durant l'enregistrement.",
      variant: "error",
    })

  const putSuccess = () =>
    toast({
      title: "Enregistrement effectué avec succès.",
    })

  useEffect(() => {
    fetchData()
  }, [])

  /** Upsert de "gestionnaire_email". */
  const upsertEmailDecisionnaire = async (email: string) => {
    try {
      const response = await apiPatch("/admin/etablissements/:id", { params: { id: etablissement?._id }, body: { gestionnaire_email: email } })
      setEtablissement(response)
      putSuccess()
    } catch (_error) {
      putError()
    }
  }

  const saveEmailDecisionnaire = async () => {
    const email = emailGestionnaireRef.current.value.trim().toLowerCase()
    if (!z.email().safeParse(email).success) {
      setEmailError(EMAIL_FORMAT_ERROR)
      emailGestionnaireRef.current.focus()
      return
    }
    setEmailError(null)
    await upsertEmailDecisionnaire(email)
  }

  if (etablissement === null) {
    return <Typography>Etablissement introuvable</Typography>
  }

  return (
    <Box sx={{ mt: fr.spacing("10v") }}>
      <Typography variant="h3" component="h2" gutterBottom>
        Etablissement
      </Typography>
      <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), py: fr.spacing("2v"), px: 0, m: 0 }}>
        <Field label="Raison sociale">{etablissement?.raison_sociale}</Field>
        <Field label="SIRET Formateur">{etablissement?.formateur_siret}</Field>
        <Field label="SIRET Gestionnaire">{etablissement?.gestionnaire_siret}</Field>
      </Box>
      <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), py: fr.spacing("2v"), px: 0, m: 0 }}>
        <Field label="Adresse">{etablissement?.formateur_address}</Field>
        <Field label="Code postal">{etablissement?.formateur_zip_code}</Field>
      </Box>
      <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), py: fr.spacing("2v"), px: 0, m: 0 }}>
        {etablissement?.optout_invitation_date && (
          <Field label="Date d'invitation à l'opt-out">
            <LbaBadge variant="neutral">{dayjs(etablissement?.optout_invitation_date).format("DD/MM/YYYY")}</LbaBadge>
          </Field>
        )}
        {etablissement?.optout_activation_date && (
          <Field label="Date d'activation des formations">
            <LbaBadge variant="neutral">{dayjs(etablissement?.optout_activation_date).format("DD/MM/YYYY")}</LbaBadge>
          </Field>
        )}
      </Box>
      {etablissement?.optout_refusal_date && (
        <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), py: fr.spacing("2v"), px: 0, m: 0 }}>
          <Field label="Date de refus de l'opt-out">
            <LbaBadge variant="neutral">{dayjs(etablissement?.optout_refusal_date).format("DD/MM/YYYY")}</LbaBadge>
          </Field>
        </Box>
      )}
      <Box sx={{ py: fr.spacing("4v") }}>
        <Box>
          <Typography component="label" htmlFor="emailDecisionnaire" sx={{ fontWeight: 700 }}>
            E-mail décisionnaire (obligatoire)
          </Typography>
          <Typography id="emailDecisionnaire-hint" className={fr.cx("fr-hint-text")} sx={{ mt: fr.spacing("2v") }}>
            {EMAIL_FORMAT_HINT}
          </Typography>
          <Box sx={{ mt: fr.spacing("4v"), display: "flex", alignItems: "center" }}>
            <Input
              sx={{ fontSize: "12px", maxWidth: "400px", width: "100%" }}
              className={fr.cx("fr-input")}
              inputRef={emailGestionnaireRef}
              defaultValue={etablissement?.gestionnaire_email}
              type="email"
              id="emailDecisionnaire"
              required
              autoComplete="off"
              error={Boolean(emailError)}
              aria-describedby={emailError ? "emailDecisionnaire-hint emailDecisionnaire-error" : "emailDecisionnaire-hint"}
            />
            <Box sx={{ ml: fr.spacing("2v") }}>
              <Button onClick={saveEmailDecisionnaire} iconId="fr-icon-save-line" title="Enregistrer l'e-mail décisionnaire" />
            </Box>
          </Box>
          {emailError && (
            <Typography id="emailDecisionnaire-error" className={fr.cx("fr-message--error")} sx={{ mt: fr.spacing("2v") }}>
              {emailError}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default EtablissementComponent
