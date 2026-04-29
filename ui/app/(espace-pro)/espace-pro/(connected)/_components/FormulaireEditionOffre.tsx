"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { Formik, useFormikContext } from "formik"
import { useState } from "react"
import type { IJob, IReferentielRomeForJob } from "shared"
import { JOB_STATUS } from "shared/models/job.model"
import { detectUrlAndEmails } from "shared/utils/detectUrlAndEmails"
import * as Yup from "yup"
import { InfosDiffusionOffre } from "@/components/DepotOffre/InfosDiffusionOffre"
import type { RomeCompetenceKey } from "@/components/DepotOffre/RomeDetail"
import { RomeDetailWithQuery } from "@/components/DepotOffre/RomeDetailWithQuery"
import { getRomeDetail } from "@/utils/api"
import { FormulaireEditionOffreButtons } from "./FormulaireEditionOffreButtons"
import { FormulaireEditionOffreFields } from "./FormulaireEditionOffreFields"

const ISO_DATE_FORMAT = "YYYY-MM-DD"
const FR_DATE_FORMAT = "DD/MM/YYYY"
const EMPLOYER_DESCRIPTION_MAX = 800

const EmployerDescriptionField = () => {
  const { values, setFieldValue, errors } = useFormikContext<any>()
  return (
    <Box>
      <Input
        label="Présentation de l'entreprise (Facultatif)"
        hintText="Décrivez les activités et les spécificités de l'entreprise."
        state={errors.job_employer_description ? "error" : "info"}
        stateRelatedMessage={
          (errors.job_employer_description as string) ??
          "Notre équipe se réserve le droit de ne diffuser que les contenus répondant à une présentation de l'entreprise. La taille du champ est limitée à 800 caractères."
        }
        textArea
        nativeTextAreaProps={{
          name: "job_employer_description",
          value: values.job_employer_description,
          maxLength: EMPLOYER_DESCRIPTION_MAX,
          rows: 5,
          onChange: (e) => setFieldValue("job_employer_description", e.target.value),
        }}
      />
    </Box>
  )
}

export const FormulaireEditionOffre = ({ offre, establishment_id, handleSave }: { offre?: IJob; establishment_id?: string; handleSave?: (values: any) => void }) => {
  const { rome_appellation_label, rome_code } = offre ?? {}
  const initRome = rome_code?.at(0)
  const [romeAndAppellation, setRomeAndAppellation] = useState<{ rome: string; appellation: string }>(
    rome_appellation_label && initRome ? { rome: initRome, appellation: rome_appellation_label } : null
  )
  const { rome } = romeAndAppellation ?? {}

  const romeQuery = useQuery({
    queryKey: ["getRomeDetail", rome],
    queryFn: () => getRomeDetail(rome) as Promise<IReferentielRomeForJob>,
    retry: false,
    enabled: Boolean(rome),
  })

  const [selectedCompetences, setSelectedCompetences] = useState<IReferentielRomeForJob["competences"] | null>(offre?.competences_rome ?? null)
  const [competencesDirty, setCompetencesDirty] = useState(false)

  const onRomeChange = (rome: string, appellation: string) => {
    setRomeAndAppellation({ rome, appellation })
    setSelectedCompetences(null)
    setCompetencesDirty(true)
  }

  const onSelectedCompetencesChange = (selectedCompetences: Record<RomeCompetenceKey, Set<string>>) => {
    if (!romeQuery.data) {
      throw new Error("inattendu : pas de données ROME")
    }
    const { competences } = romeQuery.data as IReferentielRomeForJob
    const isSelected = (groupKey: string, competence: string): boolean => selectedCompetences[groupKey].has(competence)

    const savedCompetences: IReferentielRomeForJob["competences"] = {
      savoir_etre_professionnel: competences.savoir_etre_professionnel.filter((x) => isSelected("savoir_etre_professionnel", x.libelle)),
      savoir_faire: competences.savoir_faire.flatMap((competencesGroup) => {
        const selectedItems = (competencesGroup?.items ?? []).filter(({ libelle }) => isSelected("savoir_faire", libelle))
        if (!selectedItems.length) {
          return []
        }
        return [{ ...competencesGroup, items: selectedItems }]
      }),
      savoirs: competences.savoirs.flatMap((competencesGroup) => {
        const selectedItems = (competencesGroup?.items ?? []).filter(({ libelle }) => isSelected("savoirs", libelle))
        if (!selectedItems.length) {
          return []
        }
        return [{ ...competencesGroup, items: selectedItems }]
      }),
    }
    setSelectedCompetences(savedCompetences)
    setCompetencesDirty(true)
  }

  if (!establishment_id) return <></>

  const finalSelectedCompetences = selectedCompetences ?? romeQuery?.data?.competences

  const onSubmit = (values) => {
    values = {
      ...values,
      competences_rome: finalSelectedCompetences,
      offer_title_custom: values.offer_title_custom || null,
      job_employer_description: values.job_employer_description || null,
    }
    handleSave?.(values)
  }

  const minStartDate = dayjs().startOf("day")
  const maxStartDate = dayjs().add(2, "years")
  let jobStartDateYup = Yup.date()
  if (!offre) {
    jobStartDateYup = jobStartDateYup.min(minStartDate, `La date de début doit être après le ${minStartDate.format(FR_DATE_FORMAT)}`)
  }
  jobStartDateYup = jobStartDateYup.max(maxStartDate, `La date de début doit être avant le ${maxStartDate.format(FR_DATE_FORMAT)}`).required("Champ obligatoire")

  return (
    <>
      <Formik
        validateOnMount
        enableReinitialize={true}
        initialValues={{
          rome_label: offre?.rome_label ?? "",
          rome_appellation_label: offre?.rome_appellation_label ?? "",
          rome_code: offre?.rome_code ?? [],
          job_level_label: offre?.job_level_label ?? "Indifférent",
          job_start_date: offre?.job_start_date ? dayjs(offre.job_start_date).format(ISO_DATE_FORMAT) : "",
          job_creation_date: offre?.job_creation_date ?? dayjs().format(ISO_DATE_FORMAT),
          job_expiration_date: offre?.job_expiration_date ?? dayjs().add(2, "month").format(ISO_DATE_FORMAT),
          job_status: offre?.job_status ?? JOB_STATUS.ACTIVE,
          job_type: offre?.job_type ?? ["Apprentissage"],
          delegations: offre?.delegations ?? undefined,
          job_count: offre?.job_count ?? 1,
          job_duration: offre?.job_duration ?? 12,
          job_rythm: offre?.job_rythm ?? null,
          offer_title_custom: offre?.offer_title_custom ?? "",
          job_employer_description: offre?.job_employer_description ?? "",
        }}
        validationSchema={Yup.object().shape({
          rome_label: Yup.string().required("Champ obligatoire"),
          job_level_label: Yup.string().required("Champ obligatoire"),
          job_start_date: jobStartDateYup,
          job_type: Yup.array().required("Champ obligatoire"),
          job_duration: Yup.number().max(36, "Durée maximale du contrat : 36 mois").min(6, "Durée minimale du contrat : 6 mois").required("Durée minimale du contrat : 6 mois"),
          offer_title_custom: Yup.string()
            .trim()
            .min(3, "L'intitulé est trop court. Sa taille doit être comprise entre 3 et 150 caractères.")
            .max(150, "L'intitulé est trop long. Sa taille doit être comprise entre 3 et 150 caractères.")
            .test("no-urls-emails", "Les urls et les emails sont interdits", (value) => !value || detectUrlAndEmails(value).length === 0),
          job_employer_description: Yup.string()
            .trim()
            .transform((v) => v || undefined)
            .min(30, "La présentation est trop courte (minimum 30 caractères).")
            .max(EMPLOYER_DESCRIPTION_MAX, `La présentation est trop longue (maximum ${EMPLOYER_DESCRIPTION_MAX} caractères).`),
        })}
        onSubmit={(values: any) => onSubmit(values)}
      >
        {({ values }) => (
          <div>
            <Typography component="h2">Votre offre</Typography>
            <Typography component="h6" sx={{ fontSize: "0.875rem", my: fr.spacing("4v") }}>
              Tous les champs sont obligatoires, sauf mention contraire "Facultatif".
            </Typography>
            <Box
              sx={{
                rowGap: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
                columnGap: fr.spacing("8v"),
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.4fr 2fr" },
                gridTemplateRows: { xs: "auto", md: "1fr auto" },
              }}
            >
              {/* Colonne gauche : Le contrat */}
              <Box
                sx={{
                  gridRow: { md: "1 / 3" },
                  borderRadius: fr.spacing("1v"),
                }}
              >
                <Box
                  sx={{
                    padding: { xs: fr.spacing("4v"), md: fr.spacing("6v") },
                    backgroundColor: fr.colors.decisions.background.alt.grey.default,
                    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                  }}
                >
                  <Typography component="h2" sx={{ fontWeight: 700 }}>
                    Le contrat
                  </Typography>
                  <Box sx={{ mt: fr.spacing("4v") }}>
                    <FormulaireEditionOffreFields section="contract" />
                  </Box>
                </Box>
              </Box>

              {/* Colonne droite : présentation + description de l'offre + Rome/InfosDiffusion */}
              <Box>
                <Typography variant="h4" sx={{ color: fr.colors.decisions.artwork.major.blueFrance.default }}>
                  La présentation de l'entreprise
                </Typography>
                <Box sx={{ mt: fr.spacing("4v") }}>
                  <EmployerDescriptionField />
                </Box>

                <Typography variant="h4" sx={{ color: fr.colors.decisions.artwork.major.blueFrance.default, mt: fr.spacing("8v") }}>
                  La description de l'offre
                </Typography>
                <Box sx={{ mt: fr.spacing("4v") }}>
                  <FormulaireEditionOffreFields section="offer" onRomeChange={onRomeChange} />
                </Box>

                <Box sx={{ mt: fr.spacing("4v") }}>
                  {romeAndAppellation ? (
                    <RomeDetailWithQuery
                      selectedCompetences={{
                        savoirs: new Set((finalSelectedCompetences?.savoirs ?? []).flatMap(({ items = [] }) => items.map((item) => item?.libelle))),
                        savoir_etre_professionnel: new Set((finalSelectedCompetences?.savoir_etre_professionnel ?? []).flatMap(({ libelle }) => (libelle ? [libelle] : []))),
                        savoir_faire: new Set((finalSelectedCompetences?.savoir_faire ?? []).flatMap(({ items = [] }) => items.map((item) => item?.libelle))),
                      }}
                      title={values.offer_title_custom || romeAndAppellation.appellation}
                      rome={romeAndAppellation.rome}
                      onChange={onSelectedCompetencesChange}
                    />
                  ) : (
                    <Box sx={{ display: ["none", "block"] }}>
                      <InfosDiffusionOffre />
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`, pt: fr.spacing("8v") }}>
              <FormulaireEditionOffreButtons offre={offre} competencesDirty={competencesDirty} />
            </Box>
          </div>
        )}
      </Formik>
    </>
  )
}
