"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Checkbox, FormControlLabel, Input, Typography } from "@mui/material"
import { useParams, useRouter } from "next/navigation"
import { createRef } from "react"
import type { IEligibleTrainingsForAppointmentJson, IEtablissementJson, IETFAParametersJson } from "shared"
import { referrers } from "shared/constants/referers"
import { z } from "zod"

import { InfoTooltip } from "@/app/(espace-pro)/_components/InfoToolTip"
import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"
import EtablissementComponent from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/EtablissementComponent"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { useToast } from "@/app/hooks/useToast"
import { formatDate } from "@/common/dayjs"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { apiPatch } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

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

  /**
   * @description Patch eligibleTrainingsForAppointments.
   * @param {string} id
   * @param {Object} body
   * @returns {Promise<void>}
   */
  const patchEligibleTrainingsForAppointment = async (id, body) => {
    await apiPatch("/admin/eligible-trainings-for-appointment/:id", { params: { id }, body })
  }

  /**
   * @description Save email.
   * @param parameterId
   * @param email
   * @returns {Promise<string|number>}
   */
  const saveEmail = async (parameterId, email, cle_ministere_educatif) => {
    if (!email && !z.string().email().safeParse(email).success) {
      return toast({ title: "Email de contact non valide.", variant: "error" })
    }

    await patchEligibleTrainingsForAppointment(parameterId, { lieu_formation_email: email, cle_ministere_educatif, is_lieu_formation_email_customized: true })

    toast({ title: "Email de contact mis à jour." })
  }

  /**
   * @description Disable/enable email overriding.
   * @param id
   * @param is_lieu_formation_email_customized
   * @return {Promise<void>}
   */
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

  /**
   * @description Handle referrer checkbox.
   * @param {Object} parameter
   * @param {Boolean} checked
   * @param {Object} referrer
   * @returns {Promise<void>}
   */
  const onCheckboxChange = async ({ parameter, checked, referrer }) => {
    // Add referrer
    if (checked) {
      await patchEligibleTrainingsForAppointment(parameter._id, { referrers: parameter.referrers.map((ref) => ref).concat(referrer.name) })
      refreshPage()
    } else {
      await patchEligibleTrainingsForAppointment(parameter._id, { referrers: parameter.referrers.map((ref) => ref).filter((item) => item !== referrer.name) })
      refreshPage()
    }
  }

  return (
    <AdminLayout currentAdminPage="RECHERCHE_RENDEZ_VOUS">
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.rendezVousApprentissageRecherche, PAGES.dynamic.rendezVousApprentissageDetail({ siret })]} />
      <Typography component="h2" sx={{ fontWeight: 700, mt: fr.spacing("4v") }}>
        {title}
      </Typography>
      <Box>
        {eligibleTrainingsForAppointmentResult ? (
          <>
            <EtablissementComponent id={etablissement?._id.toString()} />
            <Box sx={{ display: "flex", backgroundColor: "white", mt: fr.spacing("10v"), border: "1px solid #E0E5ED", borderRadius: "4px", borderBottom: "none" }}>
              <Typography sx={{ flex: "1", fontSize: "20px", fontWeight: 700, p: fr.spacing("4v") }}>Formations</Typography>
            </Box>
            <Box sx={{ border: "1px solid #E0E5ED", overflow: "auto", cursor: "pointer" }}>
              <Box className="fr-table">
                <Box className="fr-table__wrapper">
                  <Box className="fr-table__container">
                    <Box className="fr-table__content">
                      <Box component="table" sx={{ backgroundColor: "white" }}>
                        <Box component="thead" sx={{ color: "#ADB2BC" }}>
                          <Box component="tr" sx={{ fontSize: "0.8em", p: "1px" }}>
                            <Box component="th">FORMATION</Box>
                            <Box component="th">ADRESSE</Box>
                            <Box component="th" sx={{ width: "250px" }}>
                              LIEU FORMATION EMAIL
                            </Box>
                            <Box component="th" sx={{ width: "450px" }}>
                              CATALOGUE
                            </Box>
                            <Box component="th">SOURCE</Box>
                          </Box>
                        </Box>
                        <Box component="tbody">
                          {eligibleTrainingsForAppointmentResult.parameters.map((parameter: IEligibleTrainingsForAppointmentJson, i) => {
                            const emailRef = createRef()
                            const emailFocusRef = createRef()

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
                                      <Typography sx={{ fontWeight: 700 }}>Id parcoursup </Typography> {parameter?.parcoursup_id || "N/C"}
                                    </Box>
                                    <Box>
                                      <Typography sx={{ fontWeight: 700 }}>Intitulé</Typography> {parameter?.training_intitule_long}
                                    </Box>
                                    <DsfrLink
                                      href={`https://catalogue-apprentissage.intercariforef.org/recherche/formations?SEARCH=%22${encodeURIComponent(parameter.cle_ministere_educatif)}%22`}
                                      aria-label="La formation du Catalogue - nouvelle fenêtre"
                                    >
                                      Lien catalogue
                                    </DsfrLink>
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ fontSize: "0.8em", px: "1px", verticalAlign: "top !important" }}>
                                  <Box sx={{ width: 180 }}>
                                    <Typography>{parameter.etablissement_formateur_street}</Typography>
                                    <Typography>{parameter.etablissement_formateur_zip_code}</Typography>
                                  </Box>
                                </Box>
                                {/* @ts-expect-error: TODO */}
                                <Box component="td" onClick={() => emailFocusRef.current.focus()} sx={{ fontSize: "0.8em", px: "1px", verticalAlign: "top !important" }}>
                                  <Input
                                    sx={{ mt: "8px !important", fontSize: "12px", width: 250 }}
                                    className={fr.cx("fr-input")}
                                    inputRef={emailRef}
                                    defaultValue={parameter?.lieu_formation_email}
                                  />
                                  <Box
                                    sx={{
                                      mt: fr.spacing("4v"),
                                    }}
                                  >
                                    {/* @ts-expect-error: TODO */}
                                    <Button onClick={async () => saveEmail(parameter._id, emailRef.current.value, parameter.cle_ministere_educatif)}>OK</Button>
                                  </Box>
                                </Box>
                                <Box component="td" align="center" sx={{ fontSize: "0.8em", px: "1px", verticalAlign: "top !important", width: "350px" }}>
                                  <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                    <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                      <InfoTooltip>Désactiver l'écrasement du mail via la synchronisation catalogue</InfoTooltip>
                                      <Typography sx={{ ml: fr.spacing("1v"), width: 140 }}>DESACTIVER</Typography>
                                    </Box>
                                    <Checkbox
                                      sx={{ pt: 0, pb: fr.spacing("1v") }}
                                      checked={parameter?.is_lieu_formation_email_customized}
                                      defaultChecked={parameter?.is_lieu_formation_email_customized}
                                      onChange={async (event) => disableEmailOverriding(parameter._id, event.target.checked)}
                                      className={fr.cx("fr-mt-0")}
                                    />
                                  </Box>
                                  <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                    <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                      <InfoTooltip>Publié sur le catalogue</InfoTooltip>
                                      <Typography sx={{ ml: fr.spacing("1v"), width: 150 }}>PUBLIÉ</Typography>
                                    </Box>
                                    <Typography>{parameter?.is_catalogue_published ? "Oui" : "Non"}</Typography>
                                  </Box>
                                  <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                    <Box sx={{ display: "flex", flexDirection: "row", gap: 0 }}>
                                      <InfoTooltip>Dernière synchronisation catalogue</InfoTooltip>
                                      <Typography sx={{ ml: fr.spacing("1v"), width: 150 }}>SYNCHRO</Typography>
                                    </Box>
                                    <Typography>{parameter?.last_catalogue_sync_date ? formatDate(parameter?.last_catalogue_sync_date) : "N/A"}</Typography>
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ fontSize: "0.8em", px: "1px", verticalAlign: "top !important" }}>
                                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                    {Object.values(referrers).map((referrer, i) => {
                                      const parameterReferrers = parameter.referrers?.find((parameterReferrer) => parameterReferrer === referrer.name)
                                      return (
                                        <FormControlLabel
                                          key={`${referrer.name}-${i}`}
                                          label={referrer.name}
                                          control={
                                            <Checkbox
                                              sx={{ pt: 0, pb: fr.spacing("1v") }}
                                              checked={!!parameterReferrers}
                                              value={referrer.name}
                                              onChange={async (event) => onCheckboxChange({ parameter, referrer, checked: event.target.checked })}
                                            />
                                          }
                                        />
                                      )
                                    })}
                                  </Box>
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
    </AdminLayout>
  )
}
