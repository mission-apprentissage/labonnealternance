import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Input, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { createRef, useEffect, useState } from "react"

import "react-dates/initialize"
import "react-dates/lib/css/_datepicker.css"

import LbaBadge from "@/app/(espace-pro)/_components/Badge"
import { useToast } from "@/app/hooks/useToast"
import { dayjs } from "@/common/dayjs"
import { apiGet, apiPatch } from "@/utils/api.utils"

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box sx={{ width: "100%" }}>
    <Typography component="dt" sx={{ fontWeight: 700, mb: fr.spacing("6v") }}>
      {label}
    </Typography>
    <Box component="dd" sx={{ m: 0 }}>
      {children}
    </Box>
  </Box>
)

const EtablissementComponent = ({ id }: { id?: string }) => {
  const emailGestionnaireRef = createRef()

  const [etablissement, setEtablissement]: [any, (t: any) => void] = useState(undefined)
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
    // @ts-expect-error: TODO
    await upsertEmailDecisionnaire(emailGestionnaireRef.current.value.toLowerCase())
  }

  if (etablissement === null) {
    return <Typography>Etablissement introuvable</Typography>
  }

  return (
    <Box sx={{ backgroundColor: "white", border: "1px solid #E0E5ED", borderRadius: "4px", mt: fr.spacing("10v"), pb: fr.spacing("4v") }}>
      <Box sx={{ borderBottom: "1px solid #E0E5ED" }}>
        <Typography sx={{ fontSize: "20px", fontWeight: 700, p: fr.spacing("4v") }}>Etablissement</Typography>
      </Box>
      <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), p: fr.spacing("4v"), m: 0 }}>
        <Field label="Raison sociale">{etablissement?.raison_sociale}</Field>
        <Field label="SIRET Formateur">{etablissement?.formateur_siret}</Field>
        <Field label="SIRET Gestionnaire">{etablissement?.gestionnaire_siret}</Field>
      </Box>
      <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), p: fr.spacing("4v"), m: 0 }}>
        <Field label="Adresse">{etablissement?.formateur_address}</Field>
        <Field label="Code postal">{etablissement?.formateur_zip_code}</Field>
      </Box>
      <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), p: fr.spacing("4v"), m: 0 }}>
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
        <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), p: fr.spacing("4v"), m: 0 }}>
          <Field label="Date de refus de l'opt-out">
            <LbaBadge variant="neutral">{dayjs(etablissement?.optout_refusal_date).format("DD/MM/YYYY")}</LbaBadge>
          </Field>
        </Box>
      )}
      <Box sx={{ p: fr.spacing("4v") }}>
        <Box>
          <Typography component="label" htmlFor="emailDecisionnaire" sx={{ fontWeight: 700 }}>
            Email décisionnaire
          </Typography>
          <Box sx={{ mt: fr.spacing("6v"), display: "flex", alignItems: "center" }}>
            <Input
              sx={{ fontSize: "12px", maxWidth: "400px", width: "100%" }}
              className={fr.cx("fr-input")}
              inputRef={emailGestionnaireRef}
              defaultValue={etablissement?.gestionnaire_email}
              type="email"
              id="emailDecisionnaire"
            />
            <Box sx={{ ml: fr.spacing("2v") }}>
              <Button onClick={saveEmailDecisionnaire} iconId="fr-icon-save-line" title="Enregistrer l'Email décisionnaire" />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default EtablissementComponent
