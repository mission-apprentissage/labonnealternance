"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Checkbox, FormControlLabel, Input, Typography } from "@mui/material"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { IEligibleTrainingsForAppointmentJson, IETFAParametersJson, IEtablissementJson } from "shared"
import { referrers } from "shared/constants/referers"
import { z } from "zod"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { InfoTooltip } from "@/app/(espace-pro)/_components/InfoToolTip"
import EtablissementComponent from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/EtablissementComponent"
import { useToast } from "@/app/hooks/useToast"
import { formatDate } from "@/common/dayjs"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { apiPatch } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { EMAIL_FORMAT_ERROR, EMAIL_FORMAT_HINT } from "@/utils/validation-messages"

function LieuFormationEmailField({ parameter, onSave }: { parameter: IEligibleTrainingsForAppointmentJson; onSave: (email: string) => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const inputId = `email-${parameter._id}`
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const save = async () => {
    const email = inputRef.current.value.trim()
    if (!z.email().safeParse(email).success) {
      setError(EMAIL_FORMAT_ERROR)
      inputRef.current.focus()
      return
    }
    setError(null)
    await onSave(email)
  }

  return (
    <>
      <label htmlFor={inputId} className={fr.cx("fr-sr-only")}>
        E-mail du lieu de formation {parameter.training_intitule_long} (obligatoire)
      </label>
      <Typography id={hintId} className={fr.cx("fr-hint-text")} sx={{ fontSize: "12px" }}>
        {EMAIL_FORMAT_HINT}
      </Typography>
      <Input
        sx={{ mt: "8px !important", fontSize: "12px", width: 250 }}
        className={fr.cx("fr-input")}
        id={inputId}
        inputRef={inputRef}
        defaultValue={parameter?.lieu_formation_email}
        type="email"
        required
        autoComplete="off"
        error={Boolean(error)}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      />
      {error && (
        <Typography id={errorId} className={fr.cx("fr-message--error")} sx={{ mt: fr.spacing("1v"), fontSize: "12px", width: 250, whiteSpace: "normal" }}>
          {error}
        </Typography>
      )}
      <Box sx={{ mt: fr.spacing("4v") }}>
        <Button onClick={save}>
          Enregistrer l'e-mail
          <span className="fr-sr-only"> de la formation {parameter.training_intitule_long}</span>
        </Button>
      </Box>
    </>
  )
}

function ReferrersField({ parameter, onSave, onSaved }: { parameter: IEligibleTrainingsForAppointmentJson; onSave: (referrers: string[]) => Promise<void>; onSaved: () => void }) {
  const toast = useToast()
  // État local mis à jour au clic : les props ne changent qu'au router.refresh(), un second clic entre-temps partirait d'une liste périmée
  const [selectedReferrers, setSelectedReferrers] = useState<string[]>(parameter.referrers ?? [])
  const [isPending, setIsPending] = useState(false)
  const pendingRef = useRef(false)
  const legendId = `referrers-${parameter._id}`
  const serverReferrers = (parameter.referrers ?? []).join(",")

  useEffect(() => {
    if (!pendingRef.current) setSelectedReferrers(serverReferrers ? serverReferrers.split(",") : [])
  }, [serverReferrers])

  const onChange = async (referrer: (typeof referrers)[keyof typeof referrers], checked: boolean) => {
    // Pas de `disabled` pendant l'envoi : il retirerait le focus de la case au clavier
    if (pendingRef.current) return
    const previous = selectedReferrers
    const next = checked ? previous.concat(referrer.name) : previous.filter((item) => item !== referrer.name)
    pendingRef.current = true
    setIsPending(true)
    setSelectedReferrers(next)
    try {
      await onSave(next)
      toast({
        title: `Prise de rendez-vous ${checked ? "activée" : "désactivée"} sur ${referrer.full_name} pour la formation ${parameter.training_intitule_long}.`,
      })
      onSaved()
    } catch (_error) {
      setSelectedReferrers(previous)
      toast({ title: `La diffusion sur ${referrer.full_name} n'a pas pu être enregistrée. Réessayez.`, variant: "error" })
    } finally {
      pendingRef.current = false
      setIsPending(false)
    }
  }

  return (
    <Box role="group" aria-labelledby={legendId} aria-busy={isPending} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <span id={legendId} className="fr-sr-only">
        Plateformes de diffusion de la prise de rendez-vous pour {parameter.training_intitule_long}
      </span>
      {Object.values(referrers).map((referrer) => {
        const checkboxId = `${parameter._id}-${referrer.name}`
        return (
          <FormControlLabel
            key={referrer.name}
            htmlFor={checkboxId}
            label={referrer.full_name}
            control={
              <Checkbox
                id={checkboxId}
                sx={{ pt: 0, pb: fr.spacing("1v") }}
                checked={selectedReferrers.includes(referrer.name)}
                value={referrer.name}
                onChange={(event) => onChange(referrer, event.target.checked)}
              />
            }
          />
        )
      })}
    </Box>
  )
}

export default function RendezVousApprentissageDetailRendererClient({
  eligibleTrainingsForAppointmentResult,
  etablissement,
}: {
  eligibleTrainingsForAppointmentResult: IETFAParametersJson
  etablissement: IEtablissementJson
}) {
  const toast = useToast()
  const router = useRouter()
  const { siret } = useParams() as { siret: string }
  const refreshPage = () => router.refresh()

  const title = "Gestion de l'établissement"

  const patchEligibleTrainingsForAppointment = async (id, body) => {
    await apiPatch("/admin/eligible-trainings-for-appointment/:id", { params: { id }, body })
  }

  const saveEmail = async (parameterId, email, cle_ministere_educatif) => {
    await patchEligibleTrainingsForAppointment(parameterId, { lieu_formation_email: email, cle_ministere_educatif, is_lieu_formation_email_customized: true })

    toast({ title: "Email de contact mis à jour." })
  }

  const disableEmailOverriding = async (id, is_lieu_formation_email_customized) => {
    await patchEligibleTrainingsForAppointment(id, { is_lieu_formation_email_customized })
    if (is_lieu_formation_email_customized) {
      toast({ title: "Lors de la prochaine synchronisation l'email ne sera pas écrasé car il est personnalisé." })
    } else {
      toast({
        title: "L'email sera mis à jour automatiquement lors de la prochaine synchronisation avec le Catalogue.",
      })
    }
    refreshPage()
  }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.rendezVousApprentissageRecherche, PAGES.dynamic.rendezVousApprentissageDetail({ siret })]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {title}
      </Typography>
      <Box>
        {eligibleTrainingsForAppointmentResult ? (
          <>
            <EtablissementComponent id={etablissement?._id.toString()} />
            <Typography variant="h3" component="h2" gutterBottom sx={{ mt: fr.spacing("10v") }}>
              Formations
            </Typography>
            <Box sx={{ overflow: "hidden", cursor: "pointer" }}>
              <Box className={fr.cx("fr-table", "fr-mb-0")}>
                <Box className="fr-table__wrapper">
                  {/* Défilement vertical dans le conteneur qui défile aussi à l'horizontale : sa barre horizontale reste à l'écran sur desktop */}
                  <Box className="fr-table__container" sx={{ maxHeight: { md: "70vh" }, "& thead th": { position: { md: "sticky" }, top: 0, zIndex: 1 } }}>
                    <Box className="fr-table__content">
                      <Box component="table" sx={{ backgroundColor: "white" }}>
                        <Box component="thead" sx={{ color: "#ADB2BC" }}>
                          <Box component="tr" sx={{ fontSize: "0.8em", p: "1px" }}>
                            <Box component="th">FORMATION</Box>
                            <Box component="th">ADRESSE</Box>
                            <Box component="th" sx={{ width: "250px" }}>
                              LIEU FORMATION EMAIL (OBLIGATOIRE)
                            </Box>
                            <Box component="th" sx={{ width: "450px" }}>
                              CATALOGUE
                            </Box>
                            <Box component="th">SOURCE</Box>
                          </Box>
                        </Box>
                        <Box component="tbody">
                          {eligibleTrainingsForAppointmentResult.parameters.map((parameter: IEligibleTrainingsForAppointmentJson, i) => {
                            const disableOverridingId = `disable-overriding-${parameter._id}`

                            return (
                              <Box component="tr" key={i} sx={{ _hover: { bg: "#f4f4f4", transition: "0.5s" } }}>
                                <Box
                                  component="td"
                                  sx={{
                                    verticalAlign: "top",
                                    fontSize: "0.8em",
                                    py: fr.spacing("4v"),
                                    px: fr.spacing("1v"),
                                  }}
                                >
                                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                    <Box>
                                      <Typography sx={{ fontWeight: 700 }}>Clé ministere educatif</Typography> {parameter?.cle_ministere_educatif}
                                    </Box>
                                    <Box>
                                      <Typography sx={{ fontWeight: 700 }}>
                                        <span lang="en">Id</span> parcoursup{" "}
                                      </Typography>{" "}
                                      {parameter?.parcoursup_id || "N/C"}
                                    </Box>
                                    <Box>
                                      <Typography sx={{ fontWeight: 700 }}>Intitulé</Typography> {parameter?.training_intitule_long}
                                    </Box>
                                    <DsfrLink
                                      href={`https://catalogue-apprentissage.intercariforef.org/recherche/formations?SEARCH=%22${encodeURIComponent(parameter.cle_ministere_educatif)}%22`}
                                    >
                                      Lien catalogue
                                      <span className="fr-sr-only">{" - La formation du Catalogue"}</span>
                                    </DsfrLink>
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ fontSize: "0.8em", px: "1px", verticalAlign: "top !important" }}>
                                  <Box sx={{ width: 180, whiteSpace: "normal" }}>
                                    <Typography>{parameter.etablissement_formateur_street}</Typography>
                                    <Typography>{parameter.etablissement_formateur_zip_code}</Typography>
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ fontSize: "0.8em", px: "1px", verticalAlign: "top !important" }}>
                                  <LieuFormationEmailField parameter={parameter} onSave={(email) => saveEmail(parameter._id, email, parameter.cle_ministere_educatif)} />
                                </Box>
                                <Box component="td" align="center" sx={{ fontSize: "0.8em", px: "1px", verticalAlign: "top !important", width: "350px" }}>
                                  <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                    <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                      <InfoTooltip label="Informations sur la désactivation de l'écrasement du mail">
                                        Désactiver l'écrasement du mail via la synchronisation catalogue
                                      </InfoTooltip>
                                    </Box>
                                    <FormControlLabel
                                      htmlFor={disableOverridingId}
                                      labelPlacement="start"
                                      sx={{ ml: fr.spacing("1v"), mr: 0, alignItems: "flex-start" }}
                                      label={
                                        <Typography sx={{ width: 140, textAlign: "left" }}>
                                          DESACTIVER
                                          <span className="fr-sr-only"> l'écrasement de l'e-mail par la synchronisation catalogue</span>
                                        </Typography>
                                      }
                                      control={
                                        <Checkbox
                                          id={disableOverridingId}
                                          sx={{ pt: 0, pb: fr.spacing("1v") }}
                                          checked={parameter?.is_lieu_formation_email_customized}
                                          onChange={async (event) => disableEmailOverriding(parameter._id, event.target.checked)}
                                          className={fr.cx("fr-mt-0")}
                                        />
                                      }
                                    />
                                  </Box>
                                  <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                    <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                      <InfoTooltip label="Informations sur la publication au catalogue">Publié sur le catalogue</InfoTooltip>
                                      <Typography sx={{ ml: fr.spacing("1v"), width: 150 }}>PUBLIÉ</Typography>
                                    </Box>
                                    <Typography>{parameter?.is_catalogue_published ? "Oui" : "Non"}</Typography>
                                  </Box>
                                  <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                    <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                      <InfoTooltip label="Informations sur la synchronisation du catalogue">Dernière synchronisation catalogue</InfoTooltip>
                                      <Typography sx={{ ml: fr.spacing("1v"), width: 150 }}>SYNCHRO</Typography>
                                    </Box>
                                    <Typography>{parameter?.last_catalogue_sync_date ? formatDate(parameter?.last_catalogue_sync_date) : "N/A"}</Typography>
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ fontSize: "0.8em", px: "1px", verticalAlign: "top !important" }}>
                                  <ReferrersField
                                    parameter={parameter}
                                    onSave={(next) => patchEligibleTrainingsForAppointment(parameter._id, { referrers: next })}
                                    onSaved={refreshPage}
                                  />
                                </Box>
                              </Box>
                            )
                          })}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </>
        ) : (
          <Typography>Etablissement introuvable</Typography>
        )}
      </Box>
    </>
  )
}
